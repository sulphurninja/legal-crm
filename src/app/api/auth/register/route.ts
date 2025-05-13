import { NextRequest, NextResponse } from 'next/server';
import { generateToken, hashPassword, setAuthCookie } from '@/lib/auth';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';


export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user (default role as agent)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'agent'
    });

    // Generate JWT token
    const token = generateToken(user);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );

    // Set the auth cookie
    setAuthCookie(token, response);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
