const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetAuth() {
  try {
    console.log('🧹 Cleaning up authentication data...')

    // Delete all sessions
    const deletedSessions = await prisma.session.deleteMany({})
    console.log(`✅ Deleted ${deletedSessions.count} sessions`)

    // Delete all accounts
    const deletedAccounts = await prisma.account.deleteMany({})
    console.log(`✅ Deleted ${deletedAccounts.count} accounts`)

    // Delete all users
    const deletedUsers = await prisma.user.deleteMany({})
    console.log(`✅ Deleted ${deletedUsers.count} users`)

    // Delete all verification tokens
    const deletedTokens = await prisma.verificationToken.deleteMany({})
    console.log(`✅ Deleted ${deletedTokens.count} verification tokens`)

    console.log('🎉 Authentication data reset complete!')
    console.log('📝 You can now sign in fresh with any provider')

  } catch (error) {
    console.error('❌ Error resetting auth data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetAuth()
}

module.exports = resetAuth
