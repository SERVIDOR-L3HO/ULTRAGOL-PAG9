#!/usr/bin/env python3
import json
import re
from typing import Dict, List, Tuple

def parse_channel_line(line: str) -> Tuple[int, str]:
    match = re.match(r'\(CH(\d+)\)\s*-\s*(.+)', line.strip())
    if match:
        channel_num = int(match.group(1))
        channel_name = match.group(2).strip()
        return channel_num, channel_name
    return None, None

def normalize_name(name: str) -> str:
    return re.sub(r'[^a-z0-9]', '', name.lower())

def find_similar_channel(channel_name: str, existing_channels: List[Dict]) -> Dict:
    normalized = normalize_name(channel_name)
    for channel in existing_channels:
        if normalized in normalize_name(channel['name']) or normalize_name(channel['name']) in normalized:
            return channel
    return None

def create_channel_id(name: str) -> str:
    return re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-'))

def categorize_channel(name: str) -> Tuple[str, str, str]:
    name_lower = name.lower()
    
    if any(x in name_lower for x in ['bein', 'canal+', 'eurosport', 'rmc', 'equipe', 'ligue 1 fr', 'automoto', 'tf1', 'tmc', 'm6', 'w9', 'france', 'c+live']):
        return 'canales-francia', 'Canales Francia', '🇫🇷'
    elif any(x in name_lower for x in ['es m.laliga', 'es dazn', 'es laliga', 'es vamos', 'es m+ liga', 'es m+ deportes']):
        return 'canales-espana', 'Canales España', '🇪🇸'
    elif any(x in name_lower for x in ['tudn usa', 'bein en español', 'fox deportes', 'espn deportes', 'nbc universo', 'telemundo', 'gol español']):
        return 'canales-usa', 'Canales USA', '🇺🇸'
    elif any(x in name_lower for x in ['tnt sport arg', 'tyc sports', 'foxsport', 'arg']):
        return 'canales-argentina', 'Canales Argentina', '🇦🇷'
    elif any(x in name_lower for x in ['winsport', 'tntchile', 'liga1max', 'golperu', 'zapping']):
        return 'canales-sudamerica', 'Canales Sudamérica', '🌎'
    elif any(x in name_lower for x in ['directv', 'espn1', 'espn2', 'espn3', 'espn4', 'espn5', 'espn6', 'espn7']):
        return 'espn-directv-latam', 'ESPN & DirectTV LATAM', '📺'
    elif any(x in name_lower for x in ['mx', 'tvc deportes', 'tudnmx', 'canal5', 'azteca 7', 'vtv plus']):
        return 'canales-mexicanos', 'Canales Mexicanos', '🇲🇽'
    elif any(x in name_lower for x in ['de bundliga', 'de skyde', 'de dazn', 'de sportdigital']):
        return 'canales-alemania', 'Canales Alemania', '🇩🇪'
    elif any(x in name_lower for x in ['uk tnt', 'uk sky', 'uk epl', 'uk f1', 'uk spfl']):
        return 'canales-uk', 'Canales UK', '🇬🇧'
    elif any(x in name_lower for x in ['it dazn', 'it skycalcio', 'it feed']):
        return 'canales-italia', 'Canales Italia', '🇮🇹'
    elif any(x in name_lower for x in ['nl espn']):
        return 'canales-holanda', 'Canales Holanda', '🇳🇱'
    elif any(x in name_lower for x in ['pt sport', 'pt btv']):
        return 'canales-portugal', 'Canales Portugal', '🇵🇹'
    elif any(x in name_lower for x in ['gr sport']):
        return 'canales-grecia', 'Canales Grecia', '🇬🇷'
    elif any(x in name_lower for x in ['tr bein']):
        return 'canales-turquia', 'Canales Turquía', '🇹🇷'
    elif any(x in name_lower for x in ['be channel']):
        return 'canales-belgica', 'Canales Bélgica', '🇧🇪'
    elif 'extra sport' in name_lower:
        return 'canales-extra', 'Canales Extra', '⚡'
    else:
        return 'otros-canales', 'Otros Canales', '📺'

def main():
    print("Leyendo archivo de canales nuevos...")
    with open('attached_assets/Pasted--CH1-beIN-1-CH2-beIN-2-CH3-beIN-3-CH4-beIN-max-4-CH5-beIN-max-5-CH6-beIN-max--1760761139369_1760761139372.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_channels_data = []
    for line in lines:
        channel_num, channel_name = parse_channel_line(line)
        if channel_num and channel_name:
            new_channels_data.append({
                'number': channel_num,
                'name': channel_name,
                'url': f'https://rereyano.ru/player/3/{channel_num}'
            })
    
    print(f"Encontrados {len(new_channels_data)} canales nuevos")
    
    print("\nLeyendo JSON actual...")
    with open('attached_assets/ultracanales (1)_1760216153008.json', 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    all_existing_channels = []
    for category in json_data['categories']:
        all_existing_channels.extend(category['channels'])
    
    print(f"Canales existentes en JSON: {len(all_existing_channels)}")
    
    category_map = {}
    
    for new_channel in new_channels_data:
        print(f"\nProcesando: ({new_channel['number']}) {new_channel['name']}")
        
        existing_channel = find_similar_channel(new_channel['name'], all_existing_channels)
        
        cat_id, cat_name, cat_icon = categorize_channel(new_channel['name'])
        
        if cat_id not in category_map:
            category_map[cat_id] = {
                'id': cat_id,
                'name': cat_name,
                'icon': cat_icon,
                'channels': []
            }
        
        if existing_channel:
            print(f"  ✓ Canal existente encontrado: {existing_channel['name']}")
            
            updated_channel = {
                'id': existing_channel['id'],
                'name': existing_channel['name'],
                'sources': [new_channel['url']] + existing_channel['sources'],
                'live': True
            }
            
            channel_found = False
            for cat in json_data['categories']:
                for i, ch in enumerate(cat['channels']):
                    if ch['id'] == existing_channel['id']:
                        cat['channels'][i] = updated_channel
                        channel_found = True
                        print(f"  ✓ Canal actualizado en categoría: {cat['name']}")
                        break
                if channel_found:
                    break
        else:
            print(f"  + Nuevo canal agregado")
            new_channel_obj = {
                'id': create_channel_id(new_channel['name']),
                'name': new_channel['name'],
                'sources': [new_channel['url']],
                'live': True
            }
            category_map[cat_id]['channels'].append(new_channel_obj)
    
    for cat_id, cat_data in category_map.items():
        if cat_data['channels']:
            existing_cat = None
            for cat in json_data['categories']:
                if cat['id'] == cat_id:
                    existing_cat = cat
                    break
            
            if existing_cat:
                existing_cat['channels'].extend(cat_data['channels'])
                print(f"\n✓ Agregados {len(cat_data['channels'])} canales a categoría existente: {cat_data['name']}")
            else:
                json_data['categories'].append(cat_data)
                print(f"\n✓ Creada nueva categoría: {cat_data['name']} con {len(cat_data['channels'])} canales")
    
    print("\n\nGuardando JSON actualizado...")
    with open('attached_assets/ultracanales (1)_1760216153008.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    
    total_channels = sum(len(cat['channels']) for cat in json_data['categories'])
    print(f"\n✅ ¡Proceso completado!")
    print(f"   Total de categorías: {len(json_data['categories'])}")
    print(f"   Total de canales: {total_channels}")
    
    print("\n📊 Resumen por categoría:")
    for cat in json_data['categories']:
        print(f"   {cat['icon']} {cat['name']}: {len(cat['channels'])} canales")

if __name__ == '__main__':
    main()
