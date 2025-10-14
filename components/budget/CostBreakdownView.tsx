import React, { useState } from 'react';
import { SpendingAnalysis, Project, InventoryItem } from '../../types';
import { BudgetFilters } from '../BudgetManagementDashboard';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { 
  ChartPieIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '../icons/AnalyticsIcons';

interface CostBreakdownViewProps {
  spendingAnalysis: SpendingAnalysis | null;
  projects: Project[];
  inventory: InventoryItem[];
  filters: BudgetFilters;
}

const CostBreakdownView: React.FC<CostBreakdownViewProps> = ({
  spendingAnalysis,
  projects,
  inventory,
  filters
}) => {
  const { formatCurrency } = useCurrencyFormat();
  const [breakdownType, setBreakdownType] = useState<'category' | 'project' | 'component' | 'supplier'>('category');
  const [showDetails, setShowDetails] = useState(false);

  const generateComponentBreakdown = () => {
    const componentCosts = new Map<string, { name: string; totalCost: number; quantity: number; projects: string[] }>();
    
    projects.forEach(project => {
      project.components.forEach(component => {
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        const price = inventoryItem?.purchasePrice || 0;
        const cost = price * component.quantity;
        
        const key = inventoryItem?.name || component.name;
        if (componentCosts.has(key)) {
          const existing = componentCosts.get(key)!;
          existing.totalCost += cost;
          existing.quantity += component.quantity;
          if (!existing.projects.includes(project.name)) {
            existing.projects.push(project.name);
          }
        } else {
          componentCosts.set(key, {
            name: key,
            totalCost: cost,
            quantity: component.quantity,
            projects: [project.name]
          });
        }
      });
    });
    
    return Array.from(componentCosts.values()).sort((a, b) => b.totalCost - a.totalCost);
  };

  const generateSupplierBreakdown = () => {
    const supplierCosts = new Map<string, { name: string; totalCost: number; items: number }>();
    
    inventory.forEach(item => {
      if (item.supplier && item.purchasePrice) {
        const supplier = item.supplier;
        const cost = item.purchasePrice * item.quantity;
        
        if (supplierCosts.has(supplier)) {
          const existing = supplierCosts.get(supplier)!;
          existing.totalCost += cost;
          existing.items += 1;
        } else {
          supplierCosts.set(supplier, {
            name: supplier,
            totalCost: cost,
            items: 1
          });
        }
      }
    });
    
    return Array.from(supplierCosts.values()).sort((a, b) => b.totalCost - a.totalCost);
  };

  const generateProjectBreakdown = () => {
    return projects.map(project => {
      const projectCost = project.components.reduce((sum, component) => {
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        const price = inventoryItem?.purchasePrice || 0;
        return sum + (price * component.quantity);
      }, 0);
      
      return {
        id: project.id,
        name: project.name,
        cost: projectCost,
        components: project.components.length,
        status: project.status,
        category: project.category || 'Uncategorized'
      };
    }).sort((a, b) => b.cost - a.cost);
  };

  const componentBreakdown = generateComponentBreakdown();
  const supplierBreakdown = generateSupplierBreakdown();
  const projectBreakdown = generateProjectBreakdown();

  const getBreakdownData = () => {
    switch (breakdownType) {
      case 'category':
        return spendingAnalysis?.spendingByCategory || [];
      case 'project':
        return projectBreakdown;
      case 'component':
        return componentBreakdown;
      case 'supplier':
        return supplierBreakdown;
      default:
        return [];
    }
  };

  const getTotalAmount = () => {
    const data = getBreakdownData();
    if (breakdownType === 'category') {
      return (data as any[]).reduce((sum, item) => sum + item.amount, 0);
    } else {
      return (data as any[]).reduce((sum, item) => sum + (item.cost || item.totalCost), 0);
    }
  };

  const renderBreakdownItem = (item: any, index: number) => {
    const amount = item.amount || item.cost || item.totalCost || 0;
    const percentage = getTotalAmount() > 0 ? (amount / getTotalAmount()) * 100 : 0;
    
    return (
      <div key={item.category || item.name || item.id || index} className="p-4 bg-primary rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div 
              className="w-4 h-4 rounded mr-3"
              style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}
            />
            <h4 className="font-medium text-text-primary">
              {item.category || item.name || 'Unknown'}
            </h4>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-text-primary">{formatCurrency(amount)}</div>
            <div className="text-sm text-text-secondary">{percentage.toFixed(1)}%</div>
          </div>
        </div>
        
        <div className="w-full bg-secondary rounded-full h-2 mb-3">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`
            }}
          />
        </div>
        
        {showDetails && (
          <div className="text-sm text-text-secondary space-y-1">
            {breakdownType === 'category' && (
              <p>Category spending breakdown</p>
            )}
            {breakdownType === 'project' && (
              <>
                <p>Components: {item.components}</p>
                <p>Status: {item.status}</p>
                <p>Category: {item.category}</p>
              </>
            )}
            {breakdownType === 'component' && (
              <>
                <p>Quantity used: {item.quantity}</p>
                <p>Used in {item.projects.length} project{item.projects.length !== 1 ? 's' : ''}</p>
                <p>Projects: {item.projects.join(', ')}</p>
              </>
            )}
            {breakdownType === 'supplier' && (
              <>
                <p>Items purchased: {item.items}</p>
                <p>Average cost per item: {formatCurrency(item.totalCost / item.items)}</p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const data = getBreakdownData();
  const totalAmount = getTotalAmount();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-secondary p-4 rounded-lg shadow border border-border-color">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-text-primary">Cost Breakdown</h3>
            <div className="flex items-center space-x-2">
              {[
                { id: 'category', label: 'By Category', icon: ChartPieIcon },
                { id: 'project', label: 'By Project', icon: CubeIcon },
                { id: 'component', label: 'By Component', icon: CubeIcon },
                { id: 'supplier', label: 'By Supplier', icon: CurrencyDollarIcon }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setBreakdownType(type.id as any)}
                  className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
                    breakdownType === type.id
                      ? 'bg-green-100 text-green-800'
                      : 'bg-primary text-text-secondary hover:bg-secondary'
                  }`}
                >
                  <type.icon className="h-4 w-4 mr-1" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <InformationCircleIcon className="h-4 w-4 mr-1" />
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-text-secondary">Total Amount</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">{data.length}</div>
            <div className="text-sm text-text-secondary">
              {breakdownType === 'category' ? 'Categories' :
               breakdownType === 'project' ? 'Projects' :
               breakdownType === 'component' ? 'Components' : 'Suppliers'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">
              {data.length > 0 ? formatCurrency(totalAmount / data.length) : formatCurrency(0)}
            </div>
            <div className="text-sm text-text-secondary">Average Cost</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">
              {data.length > 0 ? Math.max(...data.map((item: any) => item.amount || item.cost || item.totalCost || 0)).toFixed(0) : '0'}%
            </div>
            <div className="text-sm text-text-secondary">Highest Share</div>
          </div>
        </div>
      </div>

      {/* Breakdown Items */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-text-primary">
            Breakdown by {breakdownType.charAt(0).toUpperCase() + breakdownType.slice(1)}
          </h4>
          <span className="text-sm text-text-secondary">{data.length} items</span>
        </div>
        
        {data.length === 0 ? (
          <div className="text-center py-12">
            <ChartPieIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No data available for the selected breakdown type</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.slice(0, 20).map((item, index) => renderBreakdownItem(item, index))}
          </div>
        )}
        
        {data.length > 20 && (
          <div className="text-center pt-6">
            <p className="text-sm text-text-secondary">
              Showing top 20 of {data.length} items
            </p>
          </div>
        )}
      </div>

      {/* Cost Saving Opportunities */}
      {spendingAnalysis?.recommendations && spendingAnalysis.recommendations.length > 0 && (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            Spending Recommendations
          </h4>
          <div className="space-y-4">
            {spendingAnalysis.recommendations.slice(0, 5).map((recommendation, index) => (
              <div key={index} className="p-4 bg-green-900/20 rounded-lg border border-green-700/30">
                <p className="text-sm text-text-primary">{recommendation}</p>
              </div>
            ))}
          </div>
          

        </div>
      )}

      {/* Insights */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Cost Breakdown Insights:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-400">
              <li>Use category breakdown to identify spending patterns</li>
              <li>Project breakdown helps track individual project costs</li>
              <li>Component breakdown shows which parts are most expensive</li>
              <li>Supplier breakdown can help negotiate better prices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdownView;