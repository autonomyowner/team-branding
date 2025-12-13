import { IsIn } from 'class-validator';
import { MemberRole } from '../entities/workspace-member.entity';

export class UpdateMemberRoleDto {
  @IsIn(['owner', 'admin', 'member', 'viewer'])
  role: MemberRole;
}
