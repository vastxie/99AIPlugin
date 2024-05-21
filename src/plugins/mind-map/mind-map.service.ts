import { Injectable } from '@nestjs/common';

@Injectable()
export class MindMapService {
  async execute(): Promise<string> {
    return '我希望你使用markdown格式回答我得问题、我的需求是得到一份markdown格式的大纲、尽量做的精细、层级多一点、不管我问你什么、都需要您回复我一个大纲出来、我想使用大纲做思维导图、除了大纲之外、不要无关内容和总结。使用我提问的语言。';
  }
}
