import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import usersModel from '../model/users.model';
import jwt, { Secret } from 'jsonwebtoken';

const { JWT_SECRET }: NodeJS.ProcessEnv = process.env;

console.log(JWT_SECRET)

const prisma = new PrismaClient();

export async function register(req : Request, res : Response, next : NextFunction) {
    try {
        let { username, email, password, role } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                status: false,
                message: 'name, email and password are required!',
                data: null
            });
        }

        let emailExist = await prisma.users.findFirst({ where: { email } });
        if (emailExist) {
            return res.status(409).json({
                status: false,
                message: 'email has already been used!',
                data: null
            });
        }

        let usernameExist = await prisma.users.findFirst({ where: { username } });
        if (usernameExist) {
            return res.status(409).json({
                status: false,
                message: 'username has already been used!',
                data: null
            });
        }

        let encryptedPassword = await bcrypt.hash(password, 10);
        
        let user = await usersModel.createUser(username, email, encryptedPassword)

        const resUser = {
            id : user?.id,
            username : user?.username,
            email : user?.email,
            role : user?.role
        }

        return res.status(201).json({
            status: true,
            message: 'OK',
            data: resUser
        });

    } catch (error) {
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        if (JWT_SECRET === undefined) {
            throw new Error('JWT_SECRET is not defined');
        }

        let { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                status: false,
                message: 'email and password are required!',
                data: null
            });
        }

        let user = await prisma.users.findFirst({ where: { email } });
        console.log(user);
        if (!user) {
            return res.status(400).json({
                status: false,
                message: 'invalid email or password!',
                data: null
            });
        }

        let isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({
                status: false,
                message: 'invalid email or password!',
                data: null
            });
        }

        const resUser = {
            id: user?.id,
            username: user?.username,
            email: user?.email,
            role: user?.role
        }

        let token = jwt.sign(resUser, JWT_SECRET as Secret);

        res.json({
            status: true,
            message: 'OK',
            data: { ...resUser, token }
        });

    } catch (error) {
        next(error);
    }
}