#!/bin/bash
# Definições de Cores
GREEN='\033[1;32m' # Verde brilhante
BLUE='\033[0;34m'  # Azul normal
YELLOW='\033[1;33m' # Amarelo brilhante
RED='\033[1;31m'   # Vermelho brilhante
RESET='\033[0m'   # Reseta a cor

while : 
do
    printf "\n"
    printf "${BLUE}======================================================${RESET}\n"
    printf "${YELLOW}   /$$                                 /$$                    
| $$                                | $$                    
| $$$$$$$   /$$$$$$  /$$$$$$$   /$$$$$$$  /$$$$$$   /$$$$$$ 
| $$__  $$ /$$__  $$| $$__  $$ /$$__  $$ /$$__  $$ /$$__  $$
| $$  \ $$| $$$$$$$$| $$  \ $$| $$  | $$| $$$$$$$$| $$  \__/
| $$  | $$| $$_____/| $$  | $$| $$  | $$| $$_____/| $$      
| $$$$$$$/|  $$$$$$$| $$  | $$|  $$$$$$$|  $$$$$$$| $$      
|_______/  \_______/|__/  |__/ \_______/ \_______/|__/      
                                                            
                                                            
                                                            \n"
    printf "${BLUE}======================================================${RESET}\n"
    printf "${GREEN}✅ SISTEMA DE MONITORAMENTO ATIVO!\n"
    printf "${GREEN}  - Iniciando o processo do Bot...\n"
    printf "${BLUE}------------------------------------------------------${RESET}\n"
    
    # Executa o npm start
    npm start
    
    # Nota: No npm start, é incomum passar argumentos como "sim" ou "não".
    # Se seu "package.json" estiver configurado para passar argumentos,
    # você pode usar o script mais complexo abaixo.
    # Se você está apenas usando "npm start" simples, a linha acima basta.
    
    sleep 1 
done

# Abaixo está o script mais complexo, se você precisar dos argumentos, 
# mas NUNCA misture os dois no mesmo arquivo. Use este se precisar do "sim/não":

# while : 
# do
# printf "${GREEN}︎Sistema de reinício automático ligado! Iniciando bot.\n"
# if [ "$1" = "sim" ]; then
# npm start -- sim  # Passa 'sim' como argumento para o comando 'start'
# elif [ "$1" = "não" ]; then
# npm start -- não # Passa 'não' como argumento para o comando 'start'
# else 
# npm start
# fi
# sleep 1 
# done