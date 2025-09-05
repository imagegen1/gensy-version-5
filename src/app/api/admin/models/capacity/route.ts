// Admin Model Capacity API Route - Manage model capacity settings

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ModelCapacityManager } from '@/lib/services/model-capacity';
import { ModelLoadBalancer } from '@/lib/services/model-load-balancer';
import { getModel, getModelsByType } from '@/lib/config/model-registry';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  // Implement your admin check logic
  return true; // For now, allow all authenticated users
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const type = searchParams.get('type');

    if (modelId) {
      // Get specific model capacity
      const capacity = ModelCapacityManager.getModelInfo(modelId);
      const registry = getModel(modelId);
      const alternatives = ModelLoadBalancer.getAlternatives(modelId);
      
      if (!capacity) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        capacity,
        registry,
        alternatives,
        utilization: ModelCapacityManager.getCapacityUtilization(modelId),
        isOverloaded: ModelCapacityManager.isModelOverloaded(modelId)
      });
    } else if (type) {
      // Get models by type
      const models = getModelsByType(type as any);
      const capacities = ModelCapacityManager.getCapacityStats();
      
      const modelsWithCapacity = models.map(model => ({
        ...model,
        capacity: capacities[model.modelId],
        utilization: ModelCapacityManager.getCapacityUtilization(model.modelId),
        isOverloaded: ModelCapacityManager.isModelOverloaded(model.modelId)
      }));

      return NextResponse.json({
        models: modelsWithCapacity,
        totalCapacity: ModelCapacityManager.getTotalCapacityByType(type as any)
      });
    } else {
      // Get all model capacities
      const capacities = ModelCapacityManager.getCapacityStats();
      const utilization = ModelCapacityManager.getCapacityUtilization();
      const overloaded = ModelCapacityManager.getOverloadedModels();
      
      return NextResponse.json({
        capacities,
        utilization,
        overloaded,
        summary: {
          totalModels: Object.keys(capacities).length,
          overloadedCount: overloaded.length,
          avgUtilization: Object.values(utilization as Record<string, number>)
            .reduce((sum, util) => sum + util, 0) / Object.keys(utilization).length
        }
      });
    }
  } catch (error) {
    console.error('Error in admin model capacity API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, modelId, parameters } = body;

    switch (action) {
      case 'add_model':
        const { capacity } = parameters;
        await ModelCapacityManager.addModel(capacity);
        return NextResponse.json({ 
          success: true, 
          message: `Added model ${capacity.modelId}` 
        });

      case 'reserve_slot':
        const reservationId = await ModelCapacityManager.reserveSlot(modelId);
        if (reservationId) {
          return NextResponse.json({ 
            success: true, 
            reservationId,
            message: `Reserved slot for ${modelId}` 
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            message: `No capacity available for ${modelId}` 
          });
        }

      case 'release_slot':
        const { reservationId: resId } = parameters;
        await ModelCapacityManager.releaseSlot(modelId, resId);
        return NextResponse.json({ 
          success: true, 
          message: `Released slot for ${modelId}` 
        });

      case 'update_metrics':
        const { processingTime, success } = parameters;
        await ModelCapacityManager.updatePerformanceMetrics(modelId, processingTime, success);
        return NextResponse.json({ 
          success: true, 
          message: `Updated metrics for ${modelId}` 
        });

      case 'add_alternative':
        const { alternativeModel, priorityOrder, qualityScore, speedScore } = parameters;
        await ModelLoadBalancer.addAlternative({
          primaryModel: modelId,
          alternativeModel,
          generationType: parameters.generationType,
          priorityOrder,
          qualityScore,
          speedScore
        });
        return NextResponse.json({ 
          success: true, 
          message: `Added alternative ${alternativeModel} for ${modelId}` 
        });

      case 'update_alternative_priority':
        const { alternativeModel: altModel, newPriority } = parameters;
        await ModelLoadBalancer.updateAlternativePriority(modelId, altModel, newPriority);
        return NextResponse.json({ 
          success: true, 
          message: `Updated priority for ${altModel}` 
        });

      case 'test_selection':
        const { request: testRequest } = parameters;
        const testResult = await ModelLoadBalancer.testModelSelection(testRequest);
        return NextResponse.json({ 
          success: true, 
          result: testResult 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin model capacity action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { modelId, updates } = body;

    if (!modelId || !updates) {
      return NextResponse.json(
        { error: 'Missing modelId or updates' },
        { status: 400 }
      );
    }

    // This would update model capacity settings
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: `Updated capacity settings for ${modelId}`,
      updates
    });
  } catch (error) {
    console.error('Error updating model capacity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
