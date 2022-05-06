import { Gender, ShareLocationStatus } from '$enums/common';
import { Request } from 'express';

export interface UpdateMemberProfile {
  name?: string;
  avatar?: string;
  gender?: Gender;
  introduce: string;
  jobId: number;
  position: string;
  birthday: string;
  jobsFollow: Array<number>;
  favoritePlace: Array<{
    id: number;
    namePlace: string;
    description: string;
    lat: number;
    lng: number;
  }>;
}

export interface UpdateMemberRequest extends Request {
  body: UpdateMemberProfile;
}

export interface UpdateGeolocationRequest extends Request {
  body: UpdateGeolocationParams;
}

export interface UpdateGeolocationParams {
  lat: number;
  lng: number;
  updateAt: number;
}

export interface IFavoritePlace {
  id?: number;
  namePlace: string;
  description: string;
  memberId?: number;
  lat: number;
  lng: number;
}

export interface ISettingShareLocation {
  shareLocationStatus: ShareLocationStatus;
  shareLocationExpire: string | Date | null;
}

export interface IListMemberFavorite {
  take: number;
  takeAfter: number;
}
