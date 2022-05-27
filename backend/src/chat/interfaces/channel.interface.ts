import { User } from "src/users/entities/user.entity";

export interface ChanI {
	chanID?: string;
	chanName?: string;
	date?: Date;
	owner?: number; //owner id
	users?: User[];
	adminUsers?: string[];
	password?: string;
	publicChannel?: boolean;
}