DROP DATABASE IF EXISTS easy_work;

CREATE DATABASE easy_work;

USE easy_work;

DROP TABLE IF EXISTS tb_users;

CREATE TABLE tb_users(
	id int AUTO_INCREMENT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    tel VARCHAR(14) NOT NULL,
    email TEXT NOT NULL,
    user_password TEXT NOT NULL
);

DROP TABLE IF EXISTS tb_messages;

CREATE TABLE tb_messages (
		id int AUTO_INCREMENT PRIMARY KEY,
        msg_user_id int NOT NULL,
        msg_text TEXT NOT NULL,
        msg_time DATETIME NOT NULL
);

DROP TABLE IF EXISTS tb_uploads;

CREATE TABLE tb_uploads(
	id int AUTO_INCREMENT PRIMARY KEY,
	sender_id int NOT NULL,
    receiver_id int NOT NULL,
    file_name TEXT NOT NULL,
    file_formated_name TEXT NOT NULL,
    file_extension VARCHAR(30) NOT NULL,
    file_description TEXT NOT NULL,
    upload_datetime DATETIME NOT NULL
);

DROP VIEW IF EXISTS vw_uploads;

CREATE VIEW vw_uploads AS
(SELECT us.file_id, us.file_name, us.file_formated_name, us.file_extension, us.file_description, us.upload_datetime, us.sender_id,
us.sender_name, us.sender_email, us.receiver_id, ur.user_name as receiver_name, ur.email as receiver_email
FROM (SELECT up.id as file_id, up.file_name, up.file_formated_name, up.file_extension, up.file_description,
up.upload_datetime, us.id as sender_id, us.first_name as sender_name, us.email as sender_email, up.receiver_id as receiver_id
FROM tb_uploads as up INNER JOIN tb_users as us ON up.sender_id = us.id) AS us INNER JOIN tb_users AS ur ON us.receiver_id = ur.id);
