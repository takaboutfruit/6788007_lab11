import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {

    @ApiProperty({ example: 'Standard Room 101', description: 'Name of the room' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @ApiProperty({ example: 'Standard room with garden view', description: 'Description of the room' })
    @IsString()
    @IsOptional()
    description!: string;

    @ApiProperty({ example: 2, description: 'Capacity of the room' })
    @IsNotEmpty()
    capacity!: number;

    @ApiProperty({ example: 1800.0, description: 'Price per night' })
    @IsNotEmpty()
    price_per_night!: number;

    @ApiProperty({ example: '/images/room101.jpg', description: 'Image of the room' })
    @IsString()
    @IsOptional()
    image_url!: string;

    @ApiProperty({ example: true, description: 'Status of the room' })
    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
