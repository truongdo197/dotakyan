export interface IListUser {
  take: number;
  pageIndex: number;
  skip: number;
  sort: any;
  keyword: string;
}

export interface IcreateUser {
  username: string;
  password: string;
  email: string;
  fullName: string;
  mobile: string;
  roleId: number;
}

export interface IupdateUser {
  fullName: string;
  mobile: string;
  roleId: number;
}

export interface IupdatePassUser {
  newPassword: string;
  oldPassword: string;
}
