import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {v4 as uuid} from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>
  ) {}
  
  async create(createUserDto: CreateUserDto): Promise<User> {
    const {username, password, parentUserId} = createUserDto;
    const user = this.userRepository.create({
      id: uuid(),
      username,
      password,
      parentUserId
    });
    try {
    return this.userRepository.save(user);
    } catch(error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }

  }

  async findOne(id: string) {
    return this.userRepository.findOne({where: {id: id}});
  }

  async findUsername(username: any): Promise <User | undefined>{
    return this.userRepository.findOne(username);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    if (updateUserDto.parentUserId) {
      const parentUser = await this.userRepository.findOne({ where: { id: updateUserDto.parentUserId } });
      if (!parentUser) {
        throw new NotFoundException(`Parent user with ID "${updateUserDto.parentUserId}" not found`);
      }
    }

    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);
    return user;
  }

  async remove(id: string): Promise<void>{
    const remove = await this.userRepository.delete({id: id});

    if (remove.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

  

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getUserTree(): Promise<any> {
    const users: any = this.userRepository.find;
    function buildTree(users: User[], parentId = null) {
      let tree: User[] = [];
    
      for(let user of users) {
        if(user.parentUserId === parentId) {
          let children = buildTree(users, user.id);
          if(children.length) {
            user.children = children;
          }
          tree.push(user);
        }
      }
    
      return tree;
    }
    return JSON.stringify(buildTree(users), null, 2);
  }
}
