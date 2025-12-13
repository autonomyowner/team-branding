import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowContainer,
  WorkflowViewport,
} from './entities/workflow.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { UpdateWorkflowContentDto } from './dto/update-workflow-content.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    private workspacesService: WorkspacesService,
  ) {}

  async findAllByWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<Workflow[]> {
    await this.checkWorkspaceAccess(workspaceId, userId);
    return this.workflowsRepository.find({
      where: { workspaceId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Workflow> {
    const workflow = await this.workflowsRepository.findOne({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    await this.checkWorkspaceAccess(workflow.workspaceId, userId);
    return workflow;
  }

  async create(
    workspaceId: string,
    userId: string,
    createDto: CreateWorkflowDto,
  ): Promise<Workflow> {
    await this.checkWorkspaceAccess(workspaceId, userId, ['owner', 'admin', 'member']);

    const workflow = this.workflowsRepository.create({
      workspaceId,
      projectId: createDto.projectId,
      name: createDto.name,
      description: createDto.description,
      nodes: [],
      edges: [],
      containers: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdBy: userId,
      status: 'draft',
      version: 1,
    });

    return this.workflowsRepository.save(workflow);
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateWorkflowDto,
  ): Promise<Workflow> {
    const workflow = await this.findById(id, userId);
    await this.checkWorkspaceAccess(workflow.workspaceId, userId, ['owner', 'admin', 'member']);

    Object.assign(workflow, updateDto);
    workflow.lastEditedBy = userId;

    return this.workflowsRepository.save(workflow);
  }

  async updateContent(
    id: string,
    userId: string,
    contentDto: UpdateWorkflowContentDto,
  ): Promise<Workflow> {
    const workflow = await this.findById(id, userId);
    await this.checkWorkspaceAccess(workflow.workspaceId, userId, ['owner', 'admin', 'member']);

    if (contentDto.nodes !== undefined) {
      workflow.nodes = contentDto.nodes;
    }
    if (contentDto.edges !== undefined) {
      workflow.edges = contentDto.edges;
    }
    if (contentDto.containers !== undefined) {
      workflow.containers = contentDto.containers;
    }
    if (contentDto.viewport !== undefined) {
      workflow.viewport = contentDto.viewport;
    }

    workflow.version += 1;
    workflow.lastEditedBy = userId;

    return this.workflowsRepository.save(workflow);
  }

  async delete(id: string, userId: string): Promise<void> {
    const workflow = await this.findById(id, userId);
    await this.checkWorkspaceAccess(workflow.workspaceId, userId, ['owner', 'admin']);

    await this.workflowsRepository.remove(workflow);
  }

  async updateNode(
    id: string,
    nodeId: string,
    userId: string,
    nodeData: Partial<WorkflowNode>,
  ): Promise<Workflow> {
    const workflow = await this.findById(id, userId);
    await this.checkWorkspaceAccess(workflow.workspaceId, userId, ['owner', 'admin', 'member']);

    const nodeIndex = workflow.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) {
      throw new NotFoundException('Node not found');
    }

    workflow.nodes[nodeIndex] = { ...workflow.nodes[nodeIndex], ...nodeData };
    workflow.version += 1;
    workflow.lastEditedBy = userId;

    return this.workflowsRepository.save(workflow);
  }

  async addNode(
    id: string,
    userId: string,
    node: WorkflowNode,
  ): Promise<Workflow> {
    const workflow = await this.findById(id, userId);
    await this.checkWorkspaceAccess(workflow.workspaceId, userId, ['owner', 'admin', 'member']);

    workflow.nodes.push(node);
    workflow.version += 1;
    workflow.lastEditedBy = userId;

    return this.workflowsRepository.save(workflow);
  }

  async deleteNode(id: string, nodeId: string, userId: string): Promise<Workflow> {
    const workflow = await this.findById(id, userId);
    await this.checkWorkspaceAccess(workflow.workspaceId, userId, ['owner', 'admin', 'member']);

    workflow.nodes = workflow.nodes.filter((n) => n.id !== nodeId);
    // Also remove edges connected to this node
    workflow.edges = workflow.edges.filter(
      (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId,
    );
    workflow.version += 1;
    workflow.lastEditedBy = userId;

    return this.workflowsRepository.save(workflow);
  }

  async addEdge(
    id: string,
    userId: string,
    edge: WorkflowEdge,
  ): Promise<Workflow> {
    const workflow = await this.findById(id, userId);
    await this.checkWorkspaceAccess(workflow.workspaceId, userId, ['owner', 'admin', 'member']);

    workflow.edges.push(edge);
    workflow.version += 1;
    workflow.lastEditedBy = userId;

    return this.workflowsRepository.save(workflow);
  }

  async deleteEdge(id: string, edgeId: string, userId: string): Promise<Workflow> {
    const workflow = await this.findById(id, userId);
    await this.checkWorkspaceAccess(workflow.workspaceId, userId, ['owner', 'admin', 'member']);

    workflow.edges = workflow.edges.filter((e) => e.id !== edgeId);
    workflow.version += 1;
    workflow.lastEditedBy = userId;

    return this.workflowsRepository.save(workflow);
  }

  private async checkWorkspaceAccess(
    workspaceId: string,
    userId: string,
    requiredRoles?: string[],
  ): Promise<void> {
    const role = await this.workspacesService.getMemberRole(workspaceId, userId);
    if (!role) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
