import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember, MemberRole } from './entities/workspace-member.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private membersRepository: Repository<WorkspaceMember>,
    private usersService: UsersService,
  ) {}

  async findAllForUser(userId: string): Promise<Workspace[]> {
    const memberships = await this.membersRepository.find({
      where: { userId },
      relations: ['workspace'],
    });

    return memberships.map((m) => m.workspace);
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.workspacesRepository.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.workspacesRepository.findOne({ where: { slug } });
  }

  async create(
    userId: string,
    createDto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    // Generate unique slug
    let slug = this.generateSlug(createDto.name);
    let slugExists = await this.findBySlug(slug);
    let counter = 1;
    while (slugExists) {
      slug = `${this.generateSlug(createDto.name)}-${counter}`;
      slugExists = await this.findBySlug(slug);
      counter++;
    }

    const workspace = this.workspacesRepository.create({
      name: createDto.name,
      description: createDto.description,
      slug,
    });

    const savedWorkspace = await this.workspacesRepository.save(workspace);

    // Add creator as owner
    const membership = this.membersRepository.create({
      workspaceId: savedWorkspace.id,
      userId,
      role: 'owner',
    });
    await this.membersRepository.save(membership);

    return this.findById(savedWorkspace.id) as Promise<Workspace>;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.findById(id);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.checkPermission(id, userId, ['owner', 'admin']);

    Object.assign(workspace, updateDto);
    await this.workspacesRepository.save(workspace);

    return this.findById(id) as Promise<Workspace>;
  }

  async archive(id: string, userId: string): Promise<void> {
    const workspace = await this.findById(id);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.checkPermission(id, userId, ['owner']);

    workspace.isArchived = true;
    await this.workspacesRepository.save(workspace);
  }

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    inviteDto: InviteMemberDto,
  ): Promise<WorkspaceMember> {
    await this.checkPermission(workspaceId, inviterId, ['owner', 'admin']);

    const user = await this.usersService.findByEmail(inviteDto.email);
    if (!user) {
      throw new NotFoundException('User not found with that email');
    }

    const existingMember = await this.membersRepository.findOne({
      where: { workspaceId, userId: user.id },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    const member = this.membersRepository.create({
      workspaceId,
      userId: user.id,
      role: inviteDto.role || 'member',
    });

    return this.membersRepository.save(member);
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    updaterId: string,
    role: MemberRole,
  ): Promise<WorkspaceMember> {
    await this.checkPermission(workspaceId, updaterId, ['owner', 'admin']);

    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId: targetUserId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner role unless you're the owner
    if (member.role === 'owner') {
      const updater = await this.membersRepository.findOne({
        where: { workspaceId, userId: updaterId },
      });
      if (updater?.role !== 'owner') {
        throw new ForbiddenException('Only owners can change owner roles');
      }
    }

    member.role = role;
    return this.membersRepository.save(member);
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    removerId: string,
  ): Promise<void> {
    await this.checkPermission(workspaceId, removerId, ['owner', 'admin']);

    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId: targetUserId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    await this.membersRepository.remove(member);
  }

  async getMemberRole(
    workspaceId: string,
    userId: string,
  ): Promise<MemberRole | null> {
    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId },
    });
    return member?.role || null;
  }

  private async checkPermission(
    workspaceId: string,
    userId: string,
    allowedRoles: MemberRole[],
  ): Promise<void> {
    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
