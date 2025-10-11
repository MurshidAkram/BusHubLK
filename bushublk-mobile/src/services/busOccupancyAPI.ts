// services/busOccupancyAPI.ts
import { API_BASE_URL } from '../config/api';

export interface AverageOccupancyData {
  bus_id: number;
  registration_number: string | null;
  calculated_occupancy_level: string;
  report_count: number;
  avg_confidence: number;
  last_report_time: string | null;
  minutes_since_last_report: number | null;
  data_freshness: 'very_fresh' | 'fresh' | 'moderate' | 'stale' | 'no_data';
  route_number: string | null;
  route_name: string | null;
}

export interface AverageOccupancyResponse {
  success: boolean;
  data: { [busId: string]: AverageOccupancyData };
  metadata: {
    time_window_minutes: number;
    buses_requested: number;
    buses_with_data: number;
    calculation_time: string;
  };
}

class BusOccupancyAPI {
  
  /**
   * Get average occupancy levels for multiple buses based on passenger reports
   * @param busIds Array of bus IDs to get occupancy data for
   * @param timeWindowMinutes Time window in minutes to consider for averaging (default: 30)
   * @returns Promise with average occupancy data for each bus
   */
  async getAverageOccupancyLevels(
    busIds: number[], 
    timeWindowMinutes: number = 30
  ): Promise<AverageOccupancyResponse> {
    try {
      const busIdsParam = busIds.join(',');
      const url = `${API_BASE_URL}/api/bus-occupancy/average?busIds=${busIdsParam}&timeWindowMinutes=${timeWindowMinutes}`;
      
      console.log(`🔄 Fetching average occupancy levels for buses: ${busIds.join(', ')}`);
      console.log(`📡 Request URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: AverageOccupancyResponse = await response.json();
      
      console.log(`✅ Successfully fetched occupancy data for ${Object.keys(data.data).length} buses`);
      console.log('📊 Occupancy summary:', {
        buses_with_reports: data.metadata.buses_with_data,
        total_buses: data.metadata.buses_requested,
        time_window: `${data.metadata.time_window_minutes} minutes`
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching average occupancy levels:', error);
      throw new Error(`Failed to fetch occupancy data: ${error.message}`);
    }
  }

  /**
   * Get occupancy level display information
   * @param level Occupancy level string
   * @returns Display information for the occupancy level
   */
  getOccupancyLevelInfo(level: string) {
    const levels = {
      'not_crowded': { 
        label: 'Not Crowded', 
        color: '#28a745', 
        description: 'Plenty of seats available',
        percentage: '25%' 
      },
      'not_too_crowded': { 
        label: 'Not Too Crowded', 
        color: '#ffc107', 
        description: 'Some seats occupied',
        percentage: '50%' 
      },
      'crowded': { 
        label: 'Crowded', 
        color: '#ff8c00', 
        description: 'Standing room only',
        percentage: '75%' 
      },
      'very_crowded': { 
        label: 'Very Crowded', 
        color: '#dc3545', 
        description: 'Bus is full',
        percentage: '100%' 
      },
      'unknown': { 
        label: 'Unknown', 
        color: '#6c757d', 
        description: 'No recent reports',
        percentage: '?%' 
      }
    };
    
    return levels[level as keyof typeof levels] || levels.unknown;
  }

  /**
   * Get data freshness indicator
   * @param freshness Data freshness level
   * @returns Display information for data freshness
   */
  getDataFreshnessInfo(freshness: string) {
    const freshness_levels = {
      'very_fresh': { label: '🟢 Live', color: '#28a745', description: 'Updated within 5 minutes' },
      'fresh': { label: '🟡 Recent', color: '#ffc107', description: 'Updated within 15 minutes' },
      'moderate': { label: '🟠 Moderate', color: '#ff8c00', description: 'Updated within 30 minutes' },
      'stale': { label: '🔴 Old', color: '#dc3545', description: 'Updated more than 30 minutes ago' },
      'no_data': { label: '⚫ No Data', color: '#6c757d', description: 'No passenger reports available' }
    };
    
    return freshness_levels[freshness as keyof typeof freshness_levels] || freshness_levels.no_data;
  }
}

export const busOccupancyAPI = new BusOccupancyAPI();
