import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import prisma from "../config/prisma.js"



// REGISTER USER
export const registerUser = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, email, password } = req.body

    // check existing user
    const existingUser =
      await prisma.user.findUnique({
        where: { email },
      })

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      })
    }

    // hash password
    const hashedPassword =
      await bcrypt.hash(password, 10)

    // create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    res.status(201).json({
      message: "User registered successfully",
      user,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: "Server error",
    })
  }
}



// LOGIN USER
export const loginUser = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body

    // find user
    const user =
      await prisma.user.findUnique({
        where: { email },
      })

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      })
    }

    // compare password
    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      )

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      })
    }

    // generate jwt token
    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    )

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: "Server error",
    })
  }
}

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId!,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    })
  }
}