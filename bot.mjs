import { once } from 'node:events';
import { Client, Events, GatewayIntentBits, Routes, SlashCommandBuilder } from 'discord.js';

const command = new SlashCommandBuilder()
  .setName('웹앱')
  .setDescription('Discord Activity로 웹앱을 엽니다.');

const applicationId = process.env.DISCORD_APPLICATION_ID?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();
const token = process.env.DISCORD_BOT_TOKEN?.trim();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.Error, (error) => {
  console.error('Discord Gateway 오류.', error.code ?? error.name);
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== command.name || interaction.guildId !== guildId) {
    return;
  }
  try {
    // Discord interaction callback: LAUNCH_ACTIVITY (type 12).
    await interaction.launchActivity();
    console.log('/웹앱 Activity 실행 응답 전송 완료');
  } catch (error) {
    // A full REST error may include the interaction token in the callback URL.
    console.error('/웹앱 Activity 실행 요청 실패.', error.code ?? error.name);
  }
});

try {
  if (!/^\d{17,20}$/.test(applicationId ?? '') || !/^\d{17,20}$/.test(guildId ?? '') || !token) {
    throw new Error('.env에 DISCORD_APPLICATION_ID, DISCORD_GUILD_ID, DISCORD_BOT_TOKEN을 입력하세요.');
  }
  await Promise.all([once(client, Events.ClientReady), client.login(token)]);
  if (client.application.id !== applicationId) {
    throw new Error('Application ID와 Bot Token을 같은 Discord 앱의 값으로 입력하세요.');
  }
  const registered = await client.rest.post(Routes.applicationGuildCommands(applicationId, guildId), {
    body: command.toJSON(),
  });
  console.log(`Gateway 연결 완료 · 서버 ${guildId}에 /${registered.name} 등록 완료`);
} catch (error) {
  console.error('봇 시작 또는 명령어 등록 실패.', error.message);
  await client.destroy();
  process.exitCode = 1;
}
