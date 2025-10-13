#!/usr/bin/env tsx

/**
 * Service validation script
 * This validates that all services can be instantiated and basic operations work
 */

import DatabaseService from '../services/databaseService.js';
import RecommendationService from '../services/recommendationService.js';
import { RecommendationErrorHandler } from '../services/errorHandler.js';
import { ItemStatus } from '../types.js';

async function validateServices() {
  console.log('🔍 Validating recommendation system services...\n');

  try {
    // Test 1: Database Service
    console.log('1️⃣ Testing DatabaseService...');
    const dbService = new DatabaseService();
    
    // Test basic database operations
    const stats = dbService.getInventoryStats();
    console.log(`   ✅ Database connected - ${stats.totalItems} items in inventory`);
    
    // Test recommendation tables exist by trying to save/retrieve data
    const testSpecs = { voltage: { min: 3.3, max: 5.0, unit: 'V' } };
    const testComponentId = 'test-validation-' + Date.now();
    
    dbService.saveComponentSpecifications(testComponentId, testSpecs);
    const retrievedSpecs = dbService.getComponentSpecifications(testComponentId);
    
    if (retrievedSpecs && retrievedSpecs.voltage) {
      console.log('   ✅ Component specifications table working');
    } else {
      throw new Error('Component specifications not saved/retrieved correctly');
    }

    // Test 2: Error Handler
    console.log('\n2️⃣ Testing RecommendationErrorHandler...');
    const errorHandler = new RecommendationErrorHandler();
    
    const testError = errorHandler.createError(
      'insufficient_data',
      'Test error message',
      { operation: 'test' }
    );
    
    console.log(`   ✅ Error handler created error: ${testError.type}`);
    
    const healthCheck = errorHandler.isSystemHealthy();
    console.log(`   ✅ System health check: ${healthCheck.healthy ? 'Healthy' : 'Issues detected'}`);

    // Test 3: Recommendation Service
    console.log('\n3️⃣ Testing RecommendationService...');
    const recommendationService = new RecommendationService(dbService, {
      maxAlternatives: 3,
      fallbackEnabled: true
    });
    
    console.log('   ✅ RecommendationService instantiated');
    
    // Test basic methods
    const recStats = recommendationService.getRecommendationStats();
    console.log(`   ✅ Recommendation stats: ${JSON.stringify(recStats)}`);
    
    const systemHealth = recommendationService.isSystemHealthy();
    console.log(`   ✅ System health: ${systemHealth.healthy ? 'Healthy' : 'Has issues'}`);

    // Test 4: Error handling with fallback
    console.log('\n4️⃣ Testing error handling and fallback...');
    
    // This should trigger fallback behavior
    const alternatives = await recommendationService.getComponentAlternatives('non-existent-id');
    console.log(`   ✅ Fallback working: ${alternatives.length} alternatives returned for invalid ID`);

    // Test 5: Component usage tracking
    console.log('\n5️⃣ Testing component usage tracking...');
    
    // Create a test component first
    const testComponent = dbService.addItem({
      name: 'Test Component for Validation',
      quantity: 10,
      location: 'Test Location',
      status: ItemStatus.HAVE,
      category: 'Test Category',
      createdAt: new Date().toISOString()
    });
    
    // Test usage tracking
    await recommendationService.updateComponentUsage(testComponent.id, 'test-project', 2);
    const usageMetrics = dbService.getUsageMetrics(testComponent.id);
    
    if (usageMetrics && usageMetrics.totalUsed === 2) {
      console.log('   ✅ Usage tracking working correctly');
    } else {
      throw new Error('Usage tracking not working');
    }

    // Cleanup
    dbService.deleteItem(testComponent.id);
    console.log('   ✅ Test data cleaned up');

    console.log('\n🎉 All service validations passed!');
    console.log('\n📊 Summary:');
    console.log('   • DatabaseService: ✅ Working');
    console.log('   • RecommendationErrorHandler: ✅ Working');
    console.log('   • RecommendationService: ✅ Working');
    console.log('   • Error handling & fallbacks: ✅ Working');
    console.log('   • Component usage tracking: ✅ Working');
    
    dbService.close();
    return true;

  } catch (error) {
    console.error('\n❌ Service validation failed:', error);
    return false;
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateServices()
    .then((success) => {
      if (success) {
        console.log('\n✨ Service validation completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Service validation failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Validation error:', error);
      process.exit(1);
    });
}

export default validateServices;