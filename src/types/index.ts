import { ObjectId } from 'mongoose';

export type UserRole = 'super_admin' | 'admin' | 'agent';

export type UserType = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeadStatus =
  | 'PENDING'
  | 'REJECTED'
  | 'VERIFIED'
  | 'REJECTED_BY_CLIENT'
  | 'PAID'
  | 'DUPLICATE'
  | 'NOT_RESPONDING'
  | 'FELONY'
  | 'DEAD_LEAD'
  | 'WORKING'
  | 'CALL_BACK'
  | 'ATTEMPT_1'
  | 'ATTEMPT_2'
  | 'ATTEMPT_3'
  | 'ATTEMPT_4'
  | 'CHARGEBACK'
  | 'WAITING_ID'
  | 'SENT_CLIENT'
  | 'QC'
  | 'ID_VERIFIED'
  | 'CAMPAIGN_PAUSED'
  | 'SENT_TO_LAW_FIRM';

export interface StatusHistoryItem {
  _id?: string | ObjectId;
  fromStatus: LeadStatus | string;
  toStatus: LeadStatus | string;
  notes: string;
  changedBy: string | ObjectId | UserType;
  timestamp: Date;
}

export interface LeadType {
  _id: string | ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: Date;
  address: string;
  applicationType: string;
  lawsuit?: string;
  notes: string;
  fields: Map<string, string>;
  status: LeadStatus;
  statusHistory: StatusHistoryItem[];
  createdBy: string | ObjectId | UserType;
  createdAt: Date;
  updatedAt: Date;
}
