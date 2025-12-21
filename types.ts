
export enum UserRole {
  COLABORADOR = 'COLABORADOR',
  ADMIN = 'ADMIN'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum RedemptionStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  PREPARING = 'PREPARING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum NotificationType {
  TASK_NEW = 'TASK_NEW',
  TASK_APPROVED = 'TASK_APPROVED',
  TASK_REJECTED = 'TASK_REJECTED',
  REWARD_READY = 'REWARD_READY',
  CHAT_MESSAGE = 'CHAT_MESSAGE'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface User {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  phone?: string;
  bio?: string;
  role: UserRole;
  team: string;
  points: number;
  totalAccumulated: number;
  level: string;
  status: 'ACTIVE' | 'INACTIVE';
  availabilityStatus?: 'ONLINE' | 'OFFLINE';
  showOnRanking: boolean;
  avatarUrl?: string;
  coverUrl?: string;
  isBlocked?: boolean;
}

export type TaskStatusTag = 'PENDENTE' | 'APROVADO' | 'URGENTE' | 'EM PRODUÇÃO' | 'ALTERAÇÃO' | 'FINALIZADO';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  targetTeam: string;
  deadline?: string;
  referenceLinks?: string[];
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  recurrence: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  evidenceRequired: boolean;
  statusTag?: TaskStatusTag;
  responsibleUserId?: string;
  creatorId: string;
  creatorName: string;
  creatorTeam: string;
}

export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  taskTitle: string;
  evidence: string;
  status: TaskStatus;
  createdAt: string;
  pointsAwarded: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  stock: number;
  category: string;
  imageUrl?: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  userId: string;
  userName: string;
  rewardName: string;
  status: RedemptionStatus;
  createdAt: string;
  cost: number;
}

export interface CommunityComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  likes: string[]; // IDs de usuários que curtiram
  comments: CommunityComment[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // 'ADMIN' para mensagens enviadas por colaboradores, ou ID do usuário para mensagens de admins
  text: string;
  createdAt: string;
  read: boolean;
  taskId?: string;
  isAutoReply?: boolean;
}

export type FeedbackCategory = 'SUGGESTION' | 'CRITICISM' | 'COMPLAINT' | 'OTHER';
export type FeedbackStatus = 'RECEIVED' | 'ANALYZING' | 'SOLVED' | 'APPLIED' | 'ARCHIVED';

export interface AnonymousFeedback {
  id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  attachmentLink?: string;
  createdAt: string;
  status: FeedbackStatus;
  internalNotes?: string;
  solutionAdopted?: string;
}