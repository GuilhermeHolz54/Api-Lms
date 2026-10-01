export class AppError extends Error { constructor(public status:number, public title:string, public detail:string, public type='about:blank'){super(detail);} }
