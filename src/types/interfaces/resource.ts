export interface IListResource {
  take: number;
  pageIndex: number;
  start: number;
  skip: number;
  sort: any;
  keyword: string;
  status: number;
}

export interface IAddResource {
  name: string;
  type: number;
  createdBy: number;
}

export interface IUpdateResource {
  name: string;
}

export interface IUpdateStatusResource {
  status: number;
}
