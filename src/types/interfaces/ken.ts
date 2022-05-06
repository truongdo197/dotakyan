export interface IListKen {
  take: number;
  pageIndex: number;
  start: number;
  skip: number;
  sort: any;
  keyword: string;
  status: number;
}

export interface IAddKen {
  name: string;
  order: number;
  createdBy: number;
}

export interface IUpdateKen {
  name: string;
  order: number;
}

export interface IUpdateStatusKen {
  status: number;
}
