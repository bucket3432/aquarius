import Firestore from '@google-cloud/firestore';
import Prisma from '@prisma/client';

const firestore = new Firestore({
  projectId: 'aquarius-dev',
  keyFilename: './packages/aquarius/.keyfile.json',
});
const prisma = new Prisma.PrismaClient();

async function migrateAnalytics() {
  console.log('\tMigrating Analytics');

  const recordList = await firestore.collection('analytics').get();
  await Promise.all(
    recordList.docs.map((record) => {
      const event = record.data();

      return prisma.analytic.create({
        data: {
          action: event.action,
          category: event.category,
          label: event.label,
          context: event.context,
          createdAt: event.date.toDate(),
        },
      });
    })
  );

  console.log('\tFinished Migrating Analytics');
}

async function migrateGuildSettings() {
  console.log('\tMigrating Guild Settings');

  const recordList = await firestore.collection('guildSettings').get();
  await Promise.all(
    recordList.docs.map(async (record) => {
      const setting = record.data();

      console.log('\t\tCreating Setting Record');
      const guildSetting = await prisma.guildSetting.create({
        data: {
          guildId: record.id,
          mute: setting.mute || undefined,
        },
      });

      console.log('\t\tCreating Ignored Users');
      const users = await Promise.all(
        setting.ignoredUsers.map((entry) => {
          return prisma.ignoredUser.create({
            data: {
              userId: entry,
              guildSetting: {
                connect: {
                  id: guildSetting.id,
                },
              },
            },
          });
        })
      );

      console.log('\t\tCreating Enabled Commands');
      const commands = await Promise.all(
        setting.enabledCommands.map((cmd) => {
          return prisma.enabledCommand.create({
            data: {
              name: cmd,
              enabled: true,
              guildSetting: {
                connect: {
                  id: guildSetting.id,
                },
              },
            },
          });
        })
      );

      console.log('\t\tCreating Command Configs');
      return Promise.all(
        Object.keys(setting.commandConfig).map((name) => {
          const config = setting.commandConfig[name];

          return Promise.all(
            Object.entries(config).map(async ([key, value]) => {
              console.log(
                `\t\t\t[${guildSetting.id}, ${name}, ${key}, ${value}]`
              );
              const cmd = await prisma.enabledCommand.findOne({
                where: {
                  guildSettingId_name: {
                    guildSettingId: guildSetting.id,
                    name,
                  },
                },
              });

              if (!cmd) {
                return Promise.resolve();
              }

              return prisma.commandConfig.create({
                data: {
                  key,
                  value,
                  command: {
                    connect: {
                      id: cmd.id,
                    },
                  },
                },
              });
            })
          );
        })
      );
    })
  );

  console.log('\tFinished Migrating Guild Settings');
}

async function migrateKarma() {
  console.log('\tMigrating Karma');

  const recordList = await firestore.collection('karma').get();
  await Promise.all(
    recordList.docs.map((record) => {
      const karma = record.data();

      return prisma.karma.create({
        data: {
          guildId: karma.guildId,
          userId: karma.userId,
          karma: karma.karma,
          lastUsage: new Date(karma.lastUsage),
        },
      });
    })
  );

  console.log('\tFinished Migrating Karma');
}

async function migrateLastSeen() {
  console.log('\tMigrating Last Seen');

  const recordList = await firestore.collection('lastSeen').get();
  await Promise.all(
    recordList.docs.map((record) => {
      const seen = record.data();

      return prisma.lastSeen.create({
        data: {
          userId: record.id,
          lastSeen: new Date(seen.lastSeen),
        },
      });
    })
  );

  console.log('\tFinished Migrating Last Seen');
}

async function migrateQuotes() {
  console.log('\tMigrating Quotes');

  const recordList = await firestore.collection('quotes').get();
  await Promise.all(
    recordList.docs.map((record) => {
      const quote = record.data();

      return prisma.quote.create({
        data: {
          guildId: quote.guildId,
          quote: quote.quote,
          quoteId: quote.quoteId,
          addedBy: quote.addedBy,
          channel: quote.channelName,
          createdAt: new Date(quote.date),
        },
      });
    })
  );

  console.log('\tFinished Migrating Quotes');
}

async function migrateReplies() {
  console.log('\tMigrating Replies');

  const recordList = await firestore.collection('replies').get();
  await Promise.all(
    recordList.docs.map((record) => {
      const reply = record.data();

      return prisma.reply.create({
        data: {
          guildId: reply.guildId,
          trigger: reply.trigger,
          response: reply.response,
        },
      });
    })
  );

  console.log('\tFinished Migrating Replies');
}

async function migrateServices() {
  console.log('\tMigrating Services');

  const recordList = await firestore.collection('services').get();
  await Promise.all(
    recordList.docs.map((record) => {
      const services = record.data();

      return Promise.all(
        Object.keys(services).map((service) =>
          prisma.service.create({
            data: {
              userId: record.id,
              name: service,
              values: services[service],
            },
          })
        )
      );
    })
  );
  console.log('\tFinished Migrating Services');
}

async function migrateSettings() {
  console.log('\tMigrating Settings');

  const recordList = await firestore.collection('settings').get();
  await Promise.all(
    recordList.docs.map((record) => {
      const setting = record.data();

      return prisma.setting.create({
        data: {
          key: record.id,
          value: setting.value,
        },
      });
    })
  );

  console.log('\tFinished Migrating Settings');
}

console.log('Starting Migration...');

Promise.all([
  // migrateAnalytics(),
  migrateGuildSettings(),
  // migrateKarma(),
  // migrateLastSeen(),
  // migrateQuotes(),
  // migrateReplies(),
  // migrateServices();
  // migrateSettings();
]).then(() => console.log('Finished Migration.'));