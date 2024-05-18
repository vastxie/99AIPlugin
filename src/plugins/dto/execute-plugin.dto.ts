import { IsString } from 'class-validator';

export class ExecutePluginDto {
  @IsString()
  prompt: string = '';
}
