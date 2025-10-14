/**
 * UltraGol API Service
 * Centraliza todas las llamadas a la API de UltraGol
 */

// Detectar si estamos en GitHub Pages o en Replit
const isGitHubPages = window.location.hostname.includes('github.io') || 
                      window.location.hostname.includes('ultragol-l3ho.com.mx');

// Usar API directa en GitHub Pages, proxy local en Replit
const API_BASE_URL = isGitHubPages 
    ? 'https://ultragol-api3.onrender.com' 
    : '/api/ultragol';

class UltraGolAPI {
    constructor() {
        this.cache = {
            tabla: null,
            goleadores: null,
            noticias: null,
            equipos: null
        };
        this.cacheTime = 5 * 60 * 1000; // 5 minutos
        this.lastFetch = {};
    }

    /**
     * Obtiene la tabla de posiciones
     */
    async getTabla() {
        const endpoint = 'tabla';
        if (this.isCacheValid(endpoint)) {
            return this.cache[endpoint];
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`);
            if (!response.ok) throw new Error('Error al cargar tabla');
            
            const data = await response.json();
            
            // Mapear datos de API al formato esperado por el proyecto
            const mappedData = data.tabla.map(team => ({
                id: this.normalizeId(team.equipo),
                name: team.equipo,
                position: team.posicion,
                played: team.estadisticas.pj,
                wins: team.estadisticas.pg,
                draws: team.estadisticas.pe,
                losses: team.estadisticas.pp,
                goalsFor: team.estadisticas.gf,
                goalsAgainst: team.estadisticas.gc,
                goalDifference: team.estadisticas.dif,
                points: team.estadisticas.pts,
                form: this.generateForm(team.estadisticas), // Generar forma basada en stats
                // Campos adicionales con valores por defecto
                homeGames: Math.floor(team.estadisticas.pj / 2),
                homeWins: Math.floor(team.estadisticas.pg / 2),
                homeDraws: Math.floor(team.estadisticas.pe / 2),
                homeLosses: Math.floor(team.estadisticas.pp / 2),
                homeGoalsFor: Math.floor(team.estadisticas.gf / 2),
                homeGoalsAgainst: Math.floor(team.estadisticas.gc / 2),
                awayGames: Math.ceil(team.estadisticas.pj / 2),
                awayWins: Math.ceil(team.estadisticas.pg / 2),
                awayDraws: Math.ceil(team.estadisticas.pe / 2),
                awayLosses: Math.ceil(team.estadisticas.pp / 2),
                awayGoalsFor: Math.ceil(team.estadisticas.gf / 2),
                awayGoalsAgainst: Math.ceil(team.estadisticas.gc / 2),
                cleanSheets: 0,
                bestScoringStreak: 0
            }));

            this.cache[endpoint] = mappedData;
            this.lastFetch[endpoint] = Date.now();
            
            console.log('✅ Tabla cargada desde API:', mappedData.length, 'equipos');
            return mappedData;
        } catch (error) {
            console.error('❌ Error al cargar tabla desde API:', error);
            throw error;
        }
    }

    /**
     * Obtiene la lista de goleadores
     */
    async getGoleadores() {
        const endpoint = 'goleadores';
        if (this.isCacheValid(endpoint)) {
            return this.cache[endpoint];
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`);
            if (!response.ok) throw new Error('Error al cargar goleadores');
            
            const data = await response.json();
            
            this.cache[endpoint] = data.goleadores;
            this.lastFetch[endpoint] = Date.now();
            
            console.log('✅ Goleadores cargados desde API:', data.goleadores.length, 'jugadores');
            return data.goleadores;
        } catch (error) {
            console.error('❌ Error al cargar goleadores desde API:', error);
            throw error;
        }
    }

    /**
     * Obtiene las noticias
     */
    async getNoticias() {
        const endpoint = 'Noticias';
        if (this.isCacheValid(endpoint)) {
            return this.cache[endpoint];
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`);
            if (!response.ok) throw new Error('Error al cargar noticias');
            
            const data = await response.json();
            
            this.cache[endpoint] = data.noticias;
            this.lastFetch[endpoint] = Date.now();
            
            console.log('✅ Noticias cargadas desde API:', data.noticias.length, 'artículos');
            return data.noticias;
        } catch (error) {
            console.error('❌ Error al cargar noticias desde API:', error);
            throw error;
        }
    }

    /**
     * Obtiene la lista de equipos
     */
    async getEquipos() {
        const endpoint = 'Equipos';
        if (this.isCacheValid(endpoint)) {
            return this.cache[endpoint];
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`);
            if (!response.ok) throw new Error('Error al cargar equipos');
            
            const data = await response.json();
            
            // Mapear datos de API al formato esperado
            const mappedData = data.equipos.map(team => ({
                id: this.normalizeId(team.nombre),
                name: team.nombre,
                nickname: team.nombre,
                shortName: team.nombreCorto,
                apiId: team.id,
                url: team.url,
                liga: team.liga,
                // Campos por defecto para mantener compatibilidad
                city: '',
                state: '',
                founded: null,
                stadium: '',
                capacity: 0,
                region: 'centro',
                colors: {
                    primary: '#000000',
                    secondary: '#ffffff'
                },
                logo: `assets/logos/${this.normalizeId(team.nombre)}.png`
            }));

            this.cache[endpoint] = mappedData;
            this.lastFetch[endpoint] = Date.now();
            
            console.log('✅ Equipos cargados desde API:', mappedData.length, 'equipos');
            return mappedData;
        } catch (error) {
            console.error('❌ Error al cargar equipos desde API:', error);
            throw error;
        }
    }

    /**
     * Normaliza el nombre del equipo para crear un ID válido
     */
    normalizeId(teamName) {
        return teamName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    /**
     * Genera array de forma (últimos 5 resultados simulados)
     */
    generateForm(stats) {
        const form = [];
        const winRate = stats.pg / stats.pj;
        const drawRate = stats.pe / stats.pj;
        
        for (let i = 0; i < 5; i++) {
            const random = Math.random();
            if (random < winRate) {
                form.push('W');
            } else if (random < winRate + drawRate) {
                form.push('D');
            } else {
                form.push('L');
            }
        }
        
        return form;
    }

    /**
     * Verifica si el cache es válido
     */
    isCacheValid(endpoint) {
        if (!this.cache[endpoint] || !this.lastFetch[endpoint]) {
            return false;
        }
        
        const timeSinceLastFetch = Date.now() - this.lastFetch[endpoint];
        return timeSinceLastFetch < this.cacheTime;
    }

    /**
     * Limpia el cache
     */
    clearCache() {
        this.cache = {
            tabla: null,
            goleadores: null,
            noticias: null,
            equipos: null
        };
        this.lastFetch = {};
        console.log('🗑️ Cache limpiado');
    }
}

// Instancia global del servicio
const ultraGolAPI = new UltraGolAPI();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ultraGolAPI;
}
