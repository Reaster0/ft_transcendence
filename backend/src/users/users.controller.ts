import	{ 	Body,
			Controller,
			Param,
			Post,
			Patch,
			Delete,
			Get,
			Query
		} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	findAllUsers() {
		// TODO add pagination query ?
		return this.usersService.findAllUsers();
	}

	@Get(':id')
	findSpecificUser(@Param('id') id: number) {
		return this.usersService.findSpecificUser('' + id); // TODO check other way to do that
	}

	@Post()
	createUser(@Body() createUserDto: CreateUserDto) {
		return this.usersService.createUser(createUserDto);
	}

	@Patch(':id')
	updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
		return this.usersService.updateUser(id, updateUserDto);
	}

	@Delete(':id')
	removeUser(@Param('id') id: string) {
		return this.usersService.removeUser(id);
	}
}
