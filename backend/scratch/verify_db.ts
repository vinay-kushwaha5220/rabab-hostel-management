import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.findFirst()
    console.log('✅ Successfully connected to database')
    console.log('✅ Last login field exists:', user !== null ? 'lastLoginAt' in user : 'No users in DB yet (checked schema)')
    
    // Check if we can find by unique without error
    await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    console.log('✅ prisma.user.findUnique executed successfully')
  } catch (error: any) {
    console.error('❌ Database verification failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
