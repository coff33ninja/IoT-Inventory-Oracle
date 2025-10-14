import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import ProjectCostTracker from './ProjectCostTracker';
import ProjectBudgetPlanner from './ProjectBudgetPlanner';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CubeIcon,
  LightBulbIcon,
  CalendarIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon
} from '../icons/AnalyticsIcons';

interface MultiProjectCostOverviewProps {
  className?: string;
}

const MultiProjectCostOverview: React.FC<MultiProjectCostOverviewProps> = ({
  className = ""
}) => {
  const { projects, calculateMultiProjectCosts } = useInventory();
  const { formatCurrency } = useCurrencyFormat();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'individual' | 'planner'>('overview');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [multiProjectData, setMultiProjectData] = useState<{
    totalCost: number;
    projectCosts: Array<{ projectId: string; projectName: string; cost: number }>;
    categoryBreakdown: Array<{ category: string; totalCost: number; projectCount: number }>;
    optimizationOpportunities: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMultiProjectData = async () => {
      setIsLoading(true);
      try {
        const data = calculateMultiProjectCosts();
        setMultiProjectData(data);
      } catch (error) {
        console.error('Error loading multi-project data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMultiProjectData();
  }, [calculateMultiProjectCosts]);

  const handleProjectBudgetUpdate = (projectId: string, budget: number) => {
    // Handle budget update - could trigger notifications or updates
    console.log(`Budget updated for project ${projectId}: ${budget}`);
  };

  if (isLoading) {
    return (
      <div className={`multi-project-cost-overview ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-secondary rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!multiProjectData) {
    return (
      <div className={`multi-project-cost-overview ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-text-primary">Unable to load project cost data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`multi-project-cost-overview ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center">
              <CubeIcon className="h-8 w-8 text-blue-500 mr-3" />
              Project Cost Management
            </h1>
            <p className="text-text-secondary">
              Track costs and budgets across all your projects
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Total Cost */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Project Costs</p>
              <p className="text-2xl font-semibold text-text-primary">
                {formatCurrency(multiProjectData.totalCost)}
              </p>
            </div>
          </div>
        </div>

        {/* Project Count */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <CubeIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Active Projects</p>
              <p className="text-2xl font-semibold text-text-primary">
                {multiProjectData.projectCosts.length}
              </p>
            </div>
          </div>
        </div>

        {/* Average Cost */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <ChartBarIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Average Cost</p>
              <p className="text-2xl font-semibold text-text-primary">
                {formatCurrency(
                  multiProjectData.projectCosts.length > 0 
                    ? multiProjectData.totalCost / multiProjectData.projectCosts.length 
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Optimization Opportunities */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <LightBulbIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Optimizations</p>
              <p className="text-2xl font-semibold text-text-primary">
                {multiProjectData.optimizationOpportunities}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Cost by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {multiProjectData.categoryBreakdown.map((category, index) => (
            <div key={category.category} className="p-4 bg-primary rounded-lg border border-border-color">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded mr-3"
                    style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                  />
                  <span className="font-medium text-text-primary">{category.category}</span>
                </div>
                <span className="text-sm text-text-secondary">
                  {category.projectCount} project{category.projectCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-xl font-bold text-text-primary">
                {formatCurrency(category.totalCost)}
              </div>
              <div className="text-sm text-text-secondary">
                {multiProjectData.totalCost > 0 
                  ? ((category.totalCost / multiProjectData.totalCost) * 100).toFixed(1)
                  : 0
                }% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-border-color">
          {[
            { id: 'overview', label: 'Project Overview', icon: ChartBarIcon },
            { id: 'individual', label: 'Individual Projects', icon: CubeIcon },
            { id: 'planner', label: 'Budget Planner', icon: CalendarIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Cost Ranking */}
            <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Projects by Cost</h3>
              <div className="space-y-3">
                {multiProjectData.projectCosts
                  .sort((a, b) => b.cost - a.cost)
                  .map((project, index) => (
                    <div key={project.projectId} className="flex items-center justify-between p-3 bg-primary rounded-lg border border-border-color">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-text-secondary w-8">#{index + 1}</span>
                        <div>
                          <h4 className="font-medium text-text-primary">{project.projectName}</h4>
                          <div className="text-sm text-text-secondary">
                            {multiProjectData.totalCost > 0 
                              ? ((project.cost / multiProjectData.totalCost) * 100).toFixed(1)
                              : 0
                            }% of total cost
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-text-primary">
                          {formatCurrency(project.cost)}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProject(project.projectId);
                            setActiveTab('individual');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cost Trends */}
            <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Cost Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-text-primary mb-3">Highest Cost Projects</h4>
                  <div className="space-y-2">
                    {multiProjectData.projectCosts
                      .sort((a, b) => b.cost - a.cost)
                      .slice(0, 3)
                      .map((project) => (
                        <div key={project.projectId} className="flex items-center justify-between text-sm">
                          <span className="text-text-primary">{project.projectName}</span>
                          <span className="font-medium text-text-primary">{formatCurrency(project.cost)}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-3">Most Active Categories</h4>
                  <div className="space-y-2">
                    {multiProjectData.categoryBreakdown
                      .sort((a, b) => b.projectCount - a.projectCount)
                      .slice(0, 3)
                      .map((category) => (
                        <div key={category.category} className="flex items-center justify-between text-sm">
                          <span className="text-text-primary">{category.category}</span>
                          <span className="font-medium text-text-primary">
                            {category.projectCount} project{category.projectCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'individual' && (
          <div className="space-y-6">
            {/* Project Selector */}
            <div className="bg-secondary p-4 rounded-lg shadow border border-border-color">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-text-primary">Select Project:</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-3 py-2 bg-primary border border-border-color rounded-md text-text-primary"
                  title="Select project to view details"
                >
                  <option value="">Choose a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Individual Project Cost Tracker */}
            {selectedProject && (
              <ProjectCostTracker 
                project={projects.find(p => p.id === selectedProject)!}
              />
            )}

            {!selectedProject && (
              <div className="text-center py-12">
                <CubeIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-primary">Select a project to view detailed cost breakdown</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'planner' && (
          <ProjectBudgetPlanner 
            projects={projects}
            onBudgetUpdate={handleProjectBudgetUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default MultiProjectCostOverview;