import { Injectable, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Chan } from '../entities/channel.entity';
import { ChanUser } from '../entities/channelUser.entity';
import { SocketJoined } from '../entities/sockets-connected-to-channel';
import { ChanI } from '../interfaces/channel.interface';
import { ChanUserI } from '../interfaces/channelUser.interface';
import { JoinedSocketI } from '../interfaces/sockets-connected-to-channel.interface';
import * as bcrypt from 'bcrypt';
import { join } from 'path';
import { Readable } from 'stream';
import { createReadStream } from 'fs';

@Injectable()
export class ChanServices {
  constructor(
    @InjectRepository(Chan)
    private readonly chanRepository: Repository<Chan>,
    @InjectRepository(ChanUser)
    private readonly chanUserRepository: Repository<ChanUser>,
    @InjectRepository(SocketJoined)
    private readonly joinedSocketRepository: Repository<SocketJoined>,
  ) {}

  async createChannel(channel: ChanI, creator: User): Promise<ChanI> {
    let { channelName, publicChannel, password, avatar } = channel;
    //console.log(channelName);
    const name = await this.chanRepository.findOne({ channelName: channelName });

//		if (!name)
		if (name) //channel name already exist
			return null;

		if (/^([a-zA-Z0-9-]+)$/.test(channelName) === false) //isalphanum()
			return null;

		channel.users.push(creator);
		channel.adminUsers = [];
		channel.owner = creator.id;

  //will see 
		if (publicChannel === false) {
			if (password) {
				const salt = await bcrypt.genSalt();
				channel.password = await bcrypt.hash(password, salt);
      }
		}
		//console.log(channel);

    if (!avatar.buffer || avatar.byteLength == 0)
      console.log('must add default avatar');
		return this.chanRepository.save(channel);
	}

	async deleteChannel(channel: ChanI) {
		/*
 		 if (!channel.id)
	  		throw new InternalServerErrorException('bad request: deleteChannel');
	  */
    const channelFound: Chan = await this.chanRepository.findOne(channel.id);
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

  async updateChannel(channel: ChanI, info: any): Promise<Boolean> {
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

  async getChannelsFromUser(id: number): Promise<ChanI[]> {

    let query = this.chanRepository
      .createQueryBuilder('chan')
      .where('chan.publicChannel = true');
    const publicChannels: ChanI[] = await query.getMany(); // gater all public channel
    console.log('---- public  Channel -----');
   // console.log(publicChannels);

    query = this.chanRepository
      .createQueryBuilder('chan')
      .leftJoin('chan.users', 'users')
      .where('users.id = :id', { id })
      .andWhere('chan.publicChannel = false')
      .leftJoinAndSelect('chan.users', 'all_user')
      .leftJoinAndSelect('chan.chanUsers', 'all_chanUser')
      .orderBy('chan.date', 'DESC');

    //console.log(query);
    const privateChannels: ChanI[] = await query.getMany();
    console.log('---- private Channel -----');
    //console.log(privateChannels);

    const channels = publicChannels.concat(privateChannels);

    channels.sort(function (date1, date2) {
      const d1 = new Date(date1.date);
      const d2 = new Date(date2.date);
      if (d1 < d2) return 1;
      else if (d1 > d2) return -1;
      else return 0;
    });

    return channels;
  }

  async getChan(channelID: string): Promise<ChanI> {
    return this.chanRepository.findOne(channelID, { relations: ['users'] });
  }

  async findUserByChannel(channel: ChanI, userId: number): Promise<ChanUserI> {
    console.log(userId, channel); //this look strange
    return this.chanUserRepository.findOne({ where: { chan: channel, userID: userId } });
  }

  async findChannel(channelName: string): Promise<Chan> {
    return this.chanRepository.findOne({channelName});
  }

  getImageFromBuffer(channels: ChanI[]): StreamableFile[] {
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

  //-------------------------------------------------//
  async findSocketByChannel(channel: ChanI): Promise<JoinedSocketI[]> {
    return this.joinedSocketRepository.find({
      where: { channel: channel },
      relations: ['user'],
    });
  }

  async addSocket(joinedChannel: JoinedSocketI): Promise<JoinedSocketI> {
    return this.joinedSocketRepository.save(joinedChannel);
  }
  async removeSocket(socketID: string) {
    return this.joinedSocketRepository.delete({ socketID });
  }
}
