export interface AppEEARSTask {
  task_id: string;
  task_name: string;
  status: string;
  created: string;
  updated: string;
}

export interface AppEEARSBundle {
  files: Array<{
    file_id: string;
    file_name: string;
    file_size: number;
    file_type: string;
  }>;
}

export interface AppEEARSToken {
  token: string;
  expiration: string;
}
