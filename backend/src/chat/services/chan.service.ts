import { Injectable, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { ChanUser } from '../entities/channelUser.entity';
import { ChannelI } from '../interfaces/channel.interface';
import { ChanUserI } from '../interfaces/channelUser.interface';
import * as bcrypt from 'bcrypt';
import { timeStamp } from 'console';
import { UsersService } from 'src/users/services/users.service';
import { FrontChannelI } from '../interfaces/frontChannel.interface';

@Injectable()
export class ChanServices {
  constructor(
    @InjectRepository(Channel)
    private readonly chanRepository: Repository<Channel>,
    @InjectRepository(ChanUser)
    private readonly chanUserRepository: Repository<ChanUser>,
    private readonly userServices: UsersService,
  ) {}

  async createChannel(channel: ChannelI, creator: User): Promise<ChannelI> {
    let { channelName, publicChannel, password, avatar } = channel;
    //console.log(channelName);
    const name = await this.chanRepository.findOne({ channelName: channelName });

		if (name) //channel name already exist
			return null;

		if (/^([a-zA-Z0-9-]+)$/.test(channelName) === false) //isalphanum()
			return null;

		channel.users.push(creator);
		channel.adminUsers = [creator.id]; //Alina asking for this
		channel.owner = creator.id;

  //will see 
		if (publicChannel === false) {
			if (password) {
				const salt = await bcrypt.genSalt();
				channel.password = await bcrypt.hash(password, salt);
      }
		}
		//console.log(channel);

		return this.chanRepository.save(channel);
	}

	async deleteChannel(channel: ChannelI) {
		/*
 		 if (!channel.id)
	  		throw new InternalServerErrorException('bad request: deleteChannel');
	  */
    const channelFound: Channel = await this.chanRepository.findOne(channel.id);
    if (channelFound) {
      /*
					 channelFound.users = []; //is this necessary ?
						 try {
							 await this.chanRepository.save(channelFound);
						 } catch (error) {
							 console.log(error);
							 throw new InternalServerErrorException('failed to empty user list');
						 }
			 */
      try {
        await this.chanRepository.delete(channelFound.id);
      } catch (error) {
        console.log(error);
        throw new InternalServerErrorException('failed to delete channel');
      }
    }
  }

  //try
  async pushUserToChan(channel: ChannelI, user: User){
    var update: ChannelI = await this.chanRepository.findOne(channel.id);
    update.users.push(user);
    this.chanRepository.update(channel.id, update);
  }

  //test
  async removeUserToChan(channel: ChannelI, user: User) {
    var update: ChannelI = await this.chanRepository.findOne(channel.id);
    const index = update.users.indexOf(user);
    if (index != -1) {
      update.users.splice(index, 1);
    }
    this.chanRepository.update(channel.id, update);
  }

  async updateChannel(channel: ChannelI, info: any): Promise<Boolean> {
		const { addPassword, password, removePassword } = info;

    if (addPassword && password) {
      if (/^([a-zA-Z0-9]+)$/.test(password) === false)
        return false;
      const salt = await bcrypt.genSalt();
      channel.password = await bcrypt.hash(password, salt);
    }
    if (removePassword)
      channel.password = '';
    
    await this.chanRepository.save(channel);
  return true;
  }

  async getChannelsFromUser(id: number): Promise<FrontChannelI[]> {

    let query = this.chanRepository
      .createQueryBuilder('channel')
      .leftJoin('channel.users', 'users')
      .where('users.id = :id', { id })
      .orderBy('channel.date', 'DESC');

    const channels: FrontChannelI[] = await query.getMany();

    //const channels = await this.userServices.getChannels(id);
    //console.log(channels);

    /*
    channels.sort(function (date1, date2) {
      const d1 = new Date(date1.date);
      const d2 = new Date(date2.date);
      if (d1 < d2) return 1;
      else if (d1 > d2) return -1;
      else return 0;
    });
    */

    return channels;
  }

  async getChan(channelID: string): Promise<ChannelI> {
    return this.chanRepository.findOne(channelID, { relations: ['users'] });
  }

  /*
  async findUserByChannel(channel: ChannelI, userID: number): Promise<ChanUserI> {
    console.log(userID, channel); //this look strange
    return this.chanUserRepository.findOne({ where: { channel: channel, userID: userID } });
  }
  */

  async findChannel(channelName: string): Promise<Channel> {
    return this.chanRepository.findOne({channelName});
  }

  /* no need anymore ----------
  GetImageFromBuffer(channels: ChannelI[]): StreamableFile[] {
    var image: StreamableFile[] = [];
    const defaultStream = createReadStream(join(process.cwd(), process.env.DEFAULT_AVATAR),);

    for (const chan of channels) {
      if (!chan.avatar || chan.avatar.byteLength === 0) {
        image.push(new StreamableFile(defaultStream));
      } else {
        const stream = Readable.from(chan.avatar);
        image.push(new StreamableFile(stream));
      }
    }
    
    return image;
  }
  */


  async getAllChanUser(channel: ChannelI): Promise<User[]> {
    const channelWhitChanUser: Channel = await this.chanRepository.findOne(
      channel.id,
      { relations: ['users'] }
    );
    return channelWhitChanUser.users;
  }

  //-------------------------------------------------//
  async findSocketByChannel(channel: ChannelI): Promise<string[]> {
    
    const member: ChannelI = await this.chanRepository.findOne({
      where: {id: channel.id},
      relations: ['users'],
    });


      var res: string[]
      for (const user of member.users) {
        res.push(user.chatSocket);
      }
      return (res);
    /*
    return this.joinedSocketRepository.find({
      where: { channel: channel },
      relations: ['user'],
    });
    */
  }

  /*
  async addSocket(joinedChannel: JoinedSocketI): Promise<JoinedSocketI> {
    return this.joinedSocketRepository.save(joinedChannel);
  }
  async removeSocket(socketID: string) {
    return this.joinedSocketRepository.delete({ socketID });
  }
  */
}
