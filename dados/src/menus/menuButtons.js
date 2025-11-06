export default async function menuButtons(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
    menuTitleIcon = "🍧ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗🍓⭟",
    separatorIcon = "❁",
    middleBorder = "┊"
} = {}) {
    // No seu arquivo atual
    const formattedHeader = header.replace(/#user#/g, userName);

    return {
        text: `\n\n🔘 *Selecione uma categoria abaixo:*`,
        title: `${botName}\n\n                         
 _             _         
| |_ ___ ___ _| |___ ___ 
| . | -_|   | . | -_|  _|
|___|___|_|_|___|___|_|  
                         `,
        subtitle: `Olá, ${userName}!`,
        footer: 'Escolha uma opção para ver os comandos',
        interactiveButtons: [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '📋 Selecionar Menu',
                    sections: [
                        {
                            title: '👑 Administração',
                            highlight_label: 'Admin',
                            rows: [
                                {
                                    header: '👑 Menu Admin',
                                    title: 'Comandos de Admin',
                                    description: 'Gerenciar grupo e usuários',
                                    id: `${prefix}menuadm`
                                }
                            ]
                        },
                        {
                            title: '🎲 Diversão',
                            highlight_label: 'Jogos',
                            rows: [
                                {
                                    header: '� Menu Brincadeiras & Jogos',
                                    title: '🎯 Diversão Total',
                                    description: '🎲 Jogos, rankings, ships e muita zoeira!',
                                    id: `${prefix}menubn`
                                }
                            ]
                        },
                        {
                            title: '👥 Membros',
                            highlight_label: 'Membros',
                            rows: [
                                {
                                    header: '👥 Menu Membros',
                                    title: 'Comandos Gerais',
                                    description: 'Comandos para todos os usuários',
                                    id: `${prefix}menumemb`
                                }
                            ]
                        },
                        {
                            title: '🎨 Criação',
                            highlight_label: 'Criar',
                            rows: [
                                {
                                    header: '🎨 Menu Stickers',
                                    title: 'Criar Figurinhas',
                                    description: 'Comandos para criar stickers',
                                    id: `${prefix}menufig`
                                }
                            ]
                        },
                        {
                            title: '💰 Economia',
                            highlight_label: 'Gold',
                            rows: [
                                {
                                    header: '💰 Menu Gold',
                                    title: 'Sistema de Economia',
                                    description: 'Ganhar e gastar gold no jogo',
                                    id: `${prefix}menugold`
                                }
                            ]
                        },
                        {
                            title: '👑 Dono',
                            highlight_label: 'Owner',
                            rows: [
                                {
                                    header: '👑 Menu Dono',
                                    title: 'Comandos do Dono',
                                    description: 'Apenas para o criador do bot',
                                    id: `${prefix}menudono`
                                }
                            ]
                        }
                    ]
                })
            }
        ]
    };
}