import { IsEmail, IsOptional, IsIn } from 'class-validator';
import { MemberRole } from '../entities/workspace-member.entity';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['admin', 'member', 'viewer'])
  role?: MemberRole;
}
