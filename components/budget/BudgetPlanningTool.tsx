import React, { useState } from 'react';
import { SpendingAnalysis, Project, InventoryItem } from '../../types';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useInventory } from '../../contexts/InventoryContext';
import BudgetOptimizationPanel from './BudgetOptimizationPanel';
import { 
  CalendarIcon,
  CurrencyDollarIcon,
  PlusIcon,
  XMarkIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '../icons/AnalyticsIcons';

interface BudgetPlanningToolProps {
  spendingAnalysis: SpendingAnalysis | null;
  projects: Project[];
  inventory: InventoryItem[];
  onBudgetUpdate: () => void;
}

interface PlannedProject {
  id: string;
  name: string;
  estimatedCost: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  timeline: string;
  components: { name: string; quantity: number; estimatedPrice: number }[];
}

interface BudgetPlan {
  totalBudget: number;
  timeframe: 'monthly' | 'quarterly' | 'yearly';
  categoryLimits: { category: string; limit: number }[];
  plannedProjects: PlannedProject[];
}

const BudgetPlanningTool: React.FC<BudgetPlanningToolProps> = ({
  spendingAnalysis,
  projects,
  inventory,
  onBudgetUpdate
}) => {
  const { formatCurrency } = useCurrencyFormat();
  const { getBudgetStatus, getProjectROI } = useInventory();
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan>({
    totalBudget: 1000,
    timeframe: 'monthly',
    categoryLimits: [],
    plannedProjects: []
  });

  const [newProject, setNewProject] = useState<Partial<PlannedProject>>({
    name: '',
    estimatedCost: 0,
    category: '',
    priority: 'medium',
    timeline: '',
    components: []
  });

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [newComponent, setNewComponent] = useState({ name: '', quantity: 1, estimatedPrice: 0 });

  const categories = Array.from(new Set([
    ...(spendingAnalysis?.spendingByCategory.map(c => c.category) || []),
    ...projects.map(p => p.category).filter(Boolean)
  ]));

  const handleBudgetChange = (field: keyof BudgetPlan, value: any) => {
    setBudgetPlan(prev => ({ ...prev, [field]: value }));
  };

  const addCategoryLimit = () => {
    const category = prompt('Enter category name:');
    const limit = prompt('Enter budget limit:');
    
    if (category && limit && !isNaN(Number(limit))) {
      setBudgetPlan(prev => ({
        ...prev,
        categoryLimits: [...prev.categoryLimits, { category, limit: Number(limit) }]
      }));
    }
  };

  const removeCategoryLimit = (index: number) => {
    setBudgetPlan(prev => ({
      ...prev,
      categoryLimits: prev.categoryLimits.filter((_, i) => i !== index)
    }));
  };

  const addComponentToProject = () => {
    if (newComponent.name && newComponent.quantity > 0 && newComponent.estimatedPrice >= 0) {
      setNewProject(prev => ({
        ...prev,
        components: [...(prev.components || []), { ...newComponent }]
      }));
      setNewComponent({ name: '', quantity: 1, estimatedPrice: 0 });
    }
  };

  const removeComponentFromProject = (index: number) => {
    setNewProject(prev => ({
      ...prev,
      components: (prev.components || []).filter((_, i) => i !== index)
    }));
  };

  const calculateProjectCost = (project: Partial<PlannedProject>) => {
    return (project.components || []).reduce((sum, comp) => sum + (comp.quantity * comp.estimatedPrice), 0);
  };

  const addPlannedProject = () => {
    if (newProject.name && newProject.category) {
      const project: PlannedProject = {
        id: Date.now().toString(),
        name: newProject.name,
        estimatedCost: calculateProjectCost(newProject),
        category: newProject.category,
        priority: newProject.priority || 'medium',
        timeline: newProject.timeline || 'TBD',
        components: newProject.components || []
      };

      setBudgetPlan(prev => ({
        ...prev,
        plannedProjects: [...prev.plannedProjects, project]
      }));

      setNewProject({
        name: '',
        estimatedCost: 0,
        category: '',
        priority: 'medium',
        timeline: '',
        components: []
      });
      setShowProjectForm(false);
    }
  };

  const removePlannedProject = (id: string) => {
    setBudgetPlan(prev => ({
      ...prev,
      plannedProjects: prev.plannedProjects.filter(p => p.id !== id)
    }));
  };

  const getTotalPlannedCost = () => {
    return budgetPlan.plannedProjects.reduce((sum, project) => sum + project.estimatedCost, 0);
  };

  const getBudgetUtilization = () => {
    return budgetPlan.totalBudget > 0 ? (getTotalPlannedCost() / budgetPlan.totalBudget) * 100 : 0;
  };

  const getCategorySpending = () => {
    const categorySpending = new Map<string, number>();
    
    budgetPlan.plannedProjects.forEach(project => {
      const current = categorySpending.get(project.category) || 0;
      categorySpending.set(project.category, current + project.estimatedCost);
    });
    
    return Array.from(categorySpending.entries()).map(([category, amount]) => ({
      category,
      amount,
      limit: budgetPlan.categoryLimits.find(l => l.category === category)?.limit || 0,
      utilization: budgetPlan.categoryLimits.find(l => l.category === category)?.limit 
        ? (amount / budgetPlan.categoryLimits.find(l => l.category === category)!.limit) * 100 
        : 0
    }));
  };

  const categorySpending = getCategorySpending();
  const budgetUtilization = getBudgetUtilization();
  
  // Get real budget status with current limits
  const budgetLimits = budgetPlan.categoryLimits.reduce((acc, limit) => {
    acc[limit.category] = limit.limit;
    return acc;
  }, {} as { [category: string]: number });
  
  const budgetStatus = getBudgetStatus(budgetLimits, budgetPlan.totalBudget);

  return (
    <div className="space-y-6">
      {/* Budget Settings */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Budget Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Total Budget
            </label>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="number"
                value={budgetPlan.totalBudget}
                onChange={(e) => handleBudgetChange('totalBudget', Number(e.target.value))}
                className="pl-10 w-full px-3 py-2 bg-primary border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary"
                placeholder="Enter total budget"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Timeframe
            </label>
            <select
              value={budgetPlan.timeframe}
              onChange={(e) => handleBudgetChange('timeframe', e.target.value)}
              className="w-full px-3 py-2 border border-border-color bg-primary text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Select budget timeframe"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <h4 className="text-lg font-semibold text-text-primary mb-4">Budget Overview</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(budgetPlan.totalBudget)}</div>
            <div className="text-sm text-blue-300">Total Budget</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(getTotalPlannedCost())}</div>
            <div className="text-sm text-green-300">Planned Spending</div>
          </div>
          <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{formatCurrency(budgetPlan.totalBudget - getTotalPlannedCost())}</div>
            <div className="text-sm text-purple-300">Remaining Budget</div>
          </div>
        </div>
        
        {/* Budget Utilization Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary">Budget Utilization</span>
            <span className="font-medium text-text-primary">{budgetUtilization.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-primary border border-border-color rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                budgetUtilization > 100 ? 'bg-red-500' :
                budgetUtilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
          {budgetUtilization > 100 && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ Planned spending exceeds budget by {formatCurrency(getTotalPlannedCost() - budgetPlan.totalBudget)}
            </p>
          )}
        </div>
      </div>

      {/* Category Limits */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-text-primary">Category Limits</h4>
          <button
            onClick={addCategoryLimit}
            className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Limit
          </button>
        </div>
        
        {budgetPlan.categoryLimits.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No category limits set</p>
        ) : (
          <div className="space-y-3">
            {budgetPlan.categoryLimits.map((limit, index) => {
              const spending = categorySpending.find(c => c.category === limit.category);
              const utilization = spending?.utilization || 0;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-primary border border-border-color rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-text-primary">{limit.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-text-secondary">
                          {formatCurrency(spending?.amount || 0)} / {formatCurrency(limit.limit)}
                        </span>
                        <button
                          onClick={() => removeCategoryLimit(index)}
                          className="text-red-400 hover:text-red-300"
                          aria-label={`Remove category limit for ${limit.category}`}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-secondary border border-border-color rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          utilization > 100 ? 'bg-red-500' :
                          utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Planned Projects */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-text-primary">Planned Projects</h4>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowOptimization(!showOptimization)}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <LightBulbIcon className="h-4 w-4 mr-1" />
              {showOptimization ? 'Hide' : 'Show'} Optimization
            </button>
            <button
              type="button"
              onClick={() => setShowProjectForm(true)}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Project
            </button>
          </div>
        </div>
        
        {budgetPlan.plannedProjects.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No planned projects yet</p>
        ) : (
          <div className="space-y-4">
            {budgetPlan.plannedProjects.map((project) => (
              <div key={project.id} className="p-4 bg-secondary border border-border-color rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="font-medium text-text-primary">{project.name}</h5>
                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <span>Category: {project.category}</span>
                      <span className={`px-2 py-1 rounded-full text-xs border ${
                        project.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        project.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        {project.priority} priority
                      </span>
                      <span>Timeline: {project.timeline}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-text-primary">
                      {formatCurrency(project.estimatedCost)}
                    </span>
                    <button
                      onClick={() => removePlannedProject(project.id)}
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Remove planned project ${project.name}`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {project.components.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-color">
                    <p className="text-sm font-medium text-text-primary mb-2">Components:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-text-secondary">
                      {project.components.map((comp, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{comp.name} (x{comp.quantity})</span>
                          <span>{formatCurrency(comp.quantity * comp.estimatedPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowProjectForm(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-secondary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-color">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Add Planned Project</h3>
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(false)}
                    className="text-text-secondary hover:text-text-primary"
                    aria-label="Close project form"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={newProject.name || ''}
                        onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-primary border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary"
                        placeholder="Enter project name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Category
                      </label>
                      <select
                        value={newProject.category || ''}
                        onChange={(e) => setNewProject(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-primary border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
                        aria-label="Select project category"
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Priority
                      </label>
                      <select
                        value={newProject.priority || 'medium'}
                        onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-primary border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
                        aria-label="Select project priority"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Timeline
                      </label>
                      <input
                        type="text"
                        value={newProject.timeline || ''}
                        onChange={(e) => setNewProject(prev => ({ ...prev, timeline: e.target.value }))}
                        className="w-full px-3 py-2 bg-primary border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary"
                        placeholder="e.g., Q1 2024, Next month"
                      />
                    </div>
                  </div>
                  
                  {/* Components */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-text-primary">
                        Components
                      </label>
                      <span className="text-sm text-text-secondary">
                        Total: {formatCurrency(calculateProjectCost(newProject))}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2 mb-2">
                      <input
                        type="text"
                        value={newComponent.name}
                        onChange={(e) => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
                        className="col-span-6 px-3 py-2 bg-primary border border-border-color rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary"
                        placeholder="Component name"
                      />
                      <input
                        type="number"
                        value={newComponent.quantity}
                        onChange={(e) => setNewComponent(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        className="col-span-2 px-3 py-2 bg-primary border border-border-color rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
                        placeholder="Qty"
                        min="1"
                      />
                      <input
                        type="number"
                        value={newComponent.estimatedPrice}
                        onChange={(e) => setNewComponent(prev => ({ ...prev, estimatedPrice: Number(e.target.value) }))}
                        className="col-span-3 px-3 py-2 bg-primary border border-border-color rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                      />
                      <button
                        onClick={addComponentToProject}
                        className="col-span-1 px-2 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        aria-label="Add component to project"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {(newProject.components || []).length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {(newProject.components || []).map((comp, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-primary border border-border-color rounded text-sm">
                            <span className="text-text-primary">{comp.name} (x{comp.quantity})</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-text-primary">{formatCurrency(comp.quantity * comp.estimatedPrice)}</span>
                              <button
                                onClick={() => removeComponentFromProject(index)}
                                className="text-red-400 hover:text-red-300"
                                aria-label={`Remove component ${comp.name}`}
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-border-color">
                  <button
                    onClick={() => setShowProjectForm(false)}
                    className="px-4 py-2 text-text-primary bg-secondary border border-border-color rounded hover:bg-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addPlannedProject}
                    disabled={!newProject.name || !newProject.category}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Optimization Panel */}
      {showOptimization && (
        <BudgetOptimizationPanel className="mb-6" />
      )}

      {/* Budget Status Alerts */}
      {budgetStatus.alerts.length > 0 && (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color mb-6">
          <h4 className="text-lg font-semibold text-text-primary mb-4">Budget Alerts</h4>
          <div className="space-y-3">
            {budgetStatus.alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                alert.type === 'danger' ? 'bg-red-900/20 border-red-500/20 text-red-400' :
                alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500/20 text-yellow-400' :
                'bg-blue-900/20 border-blue-500/20 text-blue-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.category}</p>
                    <p className="text-sm opacity-90">{alert.message}</p>
                  </div>
                  {alert.limit && (
                    <div className="text-right text-sm">
                      <div>{formatCurrency(alert.currentSpending)}</div>
                      <div className="opacity-75">of {formatCurrency(alert.limit)}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Recommendations */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start">
          <ChartBarIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <div className="text-sm text-text-primary">
            <p className="font-medium mb-1 text-blue-300">Budget Planning Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>Set realistic budgets based on historical spending</li>
              <li>Include a 10-20% buffer for unexpected costs</li>
              <li>Prioritize projects based on importance and urgency</li>
              <li>Review and adjust budgets regularly</li>
              <li>Use the optimization panel to identify cost-saving opportunities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanningTool;