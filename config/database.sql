create database iotJs;

use iotJs;

create table Users (
    id int primary key auto_increment,
    name varchar(30) unique not null,
    password varchar(100) not null
);

create table Sensors (
    id int primary key auto_increment,
    name varchar(30) not null,
    value decimal(5,2),
    time time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_user int,
    foreign key (id_user) references Users(id)
);