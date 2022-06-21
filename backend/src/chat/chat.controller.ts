import { Controller, Get, Param, Post, Query, Redirect, Req, Res, UseGuards } from "@nestjs/common";
import { RequestUser } from "src/auth/interfaces/requestUser.interface";
import { ChanServices } from "./services/chan.service";
import { UrlGeneratorService, SignedUrlGuard} from 'nestjs-url-generator';
import { AuthGuard } from "@nestjs/passport";
import { AuthUser } from "src/users/guards/userAuth.guard";
import { UsersService } from "../users/services/users.service";
import { ChannelI } from './interfaces/back.interface';
import { ChannelType } from "src/users/enums/channelType.enum";
import { FrontChannelI } from "./interfaces/front.interface";
import { User } from "src/users/entities/user.entity";
import { ChatGateway } from "./chat.gateway";
import { Response } from "express";

@Controller('chat') // localhost:3000/chat/....
export class ChatController {
    constructor(
        private readonly chanServices: ChanServices,
        private readonly urlGeneratorService: UrlGeneratorService,
        private readonly userService: UsersService,
        private readonly chatGateway: ChatGateway, //try
    ) { }

    @Get('genJoinUrl')
    async makeUrl(@Query('chanId') channelId: string): Promise<string> {
        //console.log('generating url');
        //console.log(invite);
        const params = {
            chanId: channelId,
        };

        let date = new Date();
        const res: string = this.urlGeneratorService.signControllerUrl({ controller: ChatController,
            controllerMethod: ChatController.prototype.joinChannel,
            //query: query,
            params: params,
            expirationDate: new Date(date.getTime() + 10 * 60000) //should be 10 minutes
          });

          return (res);
        }

        @Get('joinChannel/:chanId')
        @UseGuards(AuthGuard('jwt'), AuthUser)
        @UseGuards(SignedUrlGuard)
        @Redirect('http://localhost:8080/thechat')
        async joinChannel(@Param('chanId') id: string, @Req() req: RequestUser) {
        
        const channel = await this.chanServices.findChannelWithUsers(id);
        if (!channel) {return {message:"channel do not exist", success: false};}
        const user = req.user;
        const index = channel.users.indexOf(user);
        if (index !== -1) {
          return {message: "user already in channel", success: false};
        }
        const result = await this.chanServices.pushUserToChan(channel, user);
        if (!result) {
         return {message: "failed to push user to channel", success: false};
        }
        await this.chatGateway.joinPrivateChan(user.chatSocket, user.id, channel);
//        res.redirect(process.env.FRONTEND + 'thechat');
        return {message: `you've join ${channel.name}`, success: true};


        //return 'lets join this private channel';
  }

  // test ----------------------------------------------------------------
  @Get('/channeltest')
  async createChannelTest() {
    const creator = await this.userService.findUserById('2');
    const chan: ChannelI = {
        name: "channeltest3",
        password: '',
        type: ChannelType.PUBLIC
    };
    return await this.chanServices.createChannel(chan, creator);
  }

  @Get('/msgtest')
  async createMsgTest() {
  }

  @Get('joinableChannel/:id')
  async joinableChannel(@Param('id') id: number): Promise<FrontChannelI[]> {
    return await this.chanServices.filterJoinableChannel(id);
  }

  @Get('findUser/:name')
  async findUser(@Param('name') name: string): Promise<User[]> {
    return await this.userService.filterUserByName(name);
  }
}
