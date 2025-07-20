/**
 * Live Tracking Interval Monitor
 * 
 * This script helps monitor the tracking intervals to ensure 5-second timing.
 * Run this in your development environment to see real-time interval analysis.
 */

import { locationService } from '../services/locationService';

class TrackingMonitor {
  private updateTimes: number[] = [];
  private maxUpdates: number = 20; // Monitor last 20 updates

  startMonitoring() {
    console.log('🔍 Starting tracking interval monitoring...');
    console.log('Expected interval: 5.0 seconds');
    console.log('========================================');

    // Override the console.log for live tracking updates to capture timing
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      
      if (message.includes('Live tracking update sent')) {
        this.recordUpdate();
      }
      
      if (message.includes('Location update triggered after')) {
        const match = message.match(/after (\d+\.\d+)s/);
        if (match) {
          const interval = parseFloat(match[1]);
          this.analyzeInterval(interval);
        }
      }
      
      originalLog.apply(console, args);
    };
  }

  private recordUpdate() {
    const now = Date.now();
    this.updateTimes.push(now);
    
    // Keep only the last N updates
    if (this.updateTimes.length > this.maxUpdates) {
      this.updateTimes.shift();
    }
    
    this.calculateStats();
  }

  private analyzeInterval(interval: number) {
    const target = 5.0;
    const tolerance = 1.0; // ±1 second tolerance
    
    if (Math.abs(interval - target) <= tolerance) {
      console.log(`   ✅ Good interval: ${interval}s (within target range)`);
    } else if (interval < target - tolerance) {
      console.log(`   ⚡ Fast interval: ${interval}s (faster than expected)`);
    } else {
      console.log(`   ⏰ Slow interval: ${interval}s (slower than expected)`);
    }
  }

  private calculateStats() {
    if (this.updateTimes.length < 2) return;
    
    const intervals = [];
    for (let i = 1; i < this.updateTimes.length; i++) {
      const interval = (this.updateTimes[i] - this.updateTimes[i-1]) / 1000;
      intervals.push(interval);
    }
    
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const min = Math.min(...intervals);
    const max = Math.max(...intervals);
    
    console.log(`\n📊 Interval Statistics (last ${intervals.length} updates):`);
    console.log(`   Average: ${avg.toFixed(1)}s`);
    console.log(`   Min: ${min.toFixed(1)}s | Max: ${max.toFixed(1)}s`);
    console.log(`   Target: 5.0s | Variance: ${(avg - 5.0).toFixed(1)}s`);
    
    // Quality assessment
    if (avg >= 4.5 && avg <= 5.5) {
      console.log(`   🎯 Quality: EXCELLENT - On target`);
    } else if (avg >= 3.5 && avg <= 6.5) {
      console.log(`   ✅ Quality: GOOD - Close to target`);
    } else {
      console.log(`   ⚠️  Quality: NEEDS ADJUSTMENT - Off target`);
    }
    console.log('========================================\n');
  }

  generateReport() {
    if (this.updateTimes.length < 2) {
      console.log('❌ Not enough data for report');
      return;
    }

    const intervals = [];
    for (let i = 1; i < this.updateTimes.length; i++) {
      const interval = (this.updateTimes[i] - this.updateTimes[i-1]) / 1000;
      intervals.push(interval);
    }
    
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    console.log('\n📈 FINAL TRACKING REPORT');
    console.log('========================');
    console.log(`Total Updates: ${this.updateTimes.length}`);
    console.log(`Average Interval: ${avg.toFixed(2)} seconds`);
    console.log(`Standard Deviation: ${stdDev.toFixed(2)} seconds`);
    console.log(`Target: 5.00 seconds`);
    console.log(`Accuracy: ${(100 - Math.abs((avg - 5.0) / 5.0 * 100)).toFixed(1)}%`);
    
    // Recommendations
    if (avg < 4.0) {
      console.log('\n💡 RECOMMENDATION: Intervals too fast, consider increasing timeInterval');
    } else if (avg > 6.0) {
      console.log('\n💡 RECOMMENDATION: Intervals too slow, check for performance issues');
    } else {
      console.log('\n✅ RECOMMENDATION: Timing is within acceptable range');
    }
  }
}

// Usage instructions
export const trackingMonitor = new TrackingMonitor();

// Auto-start monitoring in development
if (__DEV__) {
  trackingMonitor.startMonitoring();
  
  // Generate report after 5 minutes
  setTimeout(() => {
    trackingMonitor.generateReport();
  }, 300000);
}
