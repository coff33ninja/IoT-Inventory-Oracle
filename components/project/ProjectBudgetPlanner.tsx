import React, { useState, useEffect } from "react";
import { Project, ProjectBudgetPlan, ProjectCostBreakdown } from "../../types";
import { useInventory } from "../../contexts/InventoryContext";
import { useCurrencyFormat } from "../../hooks/useCurrencyFormat";
import ProjectCostService from "../../services/projectCostService";
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
} from "../icons/AnalyticsIcons";

interface ProjectBudgetPlannerProps {
  projects: Project[];
  className?: string;
  onBudgetUpdate?: (projectId: string, budget: number) => void;
}

interface BudgetAllocation {
  projectId: string;
  projectName: string;
  allocatedBudget: number;
  currentCost: number;
  projectedCost: number;
  status: "under_budget" | "on_budget" | "over_budget";
  priority: "low" | "medium" | "high";
  timeline?: {
    startDate: string;
    endDate: string;
    milestones: number;
  };
  riskLevel?: "low" | "medium" | "high";
  budgetPlan?: ProjectBudgetPlan;
  costBreakdown?: ProjectCostBreakdown;
}

const ProjectBudgetPlanner: React.FC<ProjectBudgetPlannerProps> = ({
  projects,
  className = "",
  onBudgetUpdate,
}) => {
  const { inventory } = useInventory();
  const { formatCurrency } = useCurrencyFormat();

  const [totalBudget, setTotalBudget] = useState(5000);
  const [budgetAllocations, setBudgetAllocations] = useState<
    BudgetAllocation[]
  >([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [newBudgetAmount, setNewBudgetAmount] = useState(0);
  const [contingencyPercentage, setContingencyPercentage] = useState(15);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateBudgetAllocations = async () => {
      setIsLoading(true);
      try {
        const allocations: BudgetAllocation[] = [];

        for (const project of projects) {
          const costBreakdown =
            ProjectCostService.calculateProjectCostBreakdown(
              project,
              inventory
            );

          // Calculate suggested budget (current cost + contingency)
          const suggestedBudget =
            costBreakdown.totalCost * (1 + contingencyPercentage / 100);

          // Determine status
          let status: "under_budget" | "on_budget" | "over_budget" =
            "on_budget";
          if (costBreakdown.totalCost < suggestedBudget * 0.8) {
            status = "under_budget";
          } else if (costBreakdown.totalCost > suggestedBudget) {
            status = "over_budget";
          }

          // Determine priority based on project status and cost
          let priority: "low" | "medium" | "high" = "medium";
          if (
            project.status === "In Progress" ||
            costBreakdown.totalCost > 500
          ) {
            priority = "high";
          } else if (
            project.status === "Planning" ||
            costBreakdown.totalCost < 100
          ) {
            priority = "low";
          }

          // Determine risk level based on cost and complexity
          let riskLevel: "low" | "medium" | "high" = "low";
          if (costBreakdown.totalCost > 1000 || status === "over_budget") {
            riskLevel = "high";
          } else if (costBreakdown.totalCost > 500 || priority === "high") {
            riskLevel = "medium";
          }

          // Create timeline based on project status
          const timeline = {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
            milestones: Math.ceil(costBreakdown.componentCosts?.length / 5) || 1,
          };

          allocations.push({
            projectId: project.id,
            projectName: project.name,
            allocatedBudget: suggestedBudget,
            currentCost: costBreakdown.totalCost,
            projectedCost: suggestedBudget,
            status,
            priority,
            riskLevel,
            timeline,
            costBreakdown,
          });
        }

        setBudgetAllocations(allocations);
      } catch (error) {
        console.error("Error calculating budget allocations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateBudgetAllocations();
  }, [projects, inventory, contingencyPercentage]);

  const handleAddProjectBudget = () => {
    if (selectedProject && newBudgetAmount > 0) {
      const project = projects.find((p) => p.id === selectedProject);
      if (project) {
        const costBreakdown = ProjectCostService.calculateProjectCostBreakdown(
          project,
          inventory
        );

        let status: "under_budget" | "on_budget" | "over_budget" = "on_budget";
        if (costBreakdown.totalCost < newBudgetAmount * 0.8) {
          status = "under_budget";
        } else if (costBreakdown.totalCost > newBudgetAmount) {
          status = "over_budget";
        }

        const newAllocation: BudgetAllocation = {
          projectId: project.id,
          projectName: project.name,
          allocatedBudget: newBudgetAmount,
          currentCost: costBreakdown.totalCost,
          projectedCost: newBudgetAmount,
          status,
          priority: "medium",
        };

        setBudgetAllocations((prev) => {
          const existing = prev.find((a) => a.projectId === project.id);
          if (existing) {
            return prev.map((a) =>
              a.projectId === project.id ? newAllocation : a
            );
          } else {
            return [...prev, newAllocation];
          }
        });

        if (onBudgetUpdate) {
          onBudgetUpdate(project.id, newBudgetAmount);
        }

        setSelectedProject("");
        setNewBudgetAmount(0);
        setShowAddProject(false);
      }
    }
  };

  const handleRemoveAllocation = (projectId: string) => {
    setBudgetAllocations((prev) =>
      prev.filter((a) => a.projectId !== projectId)
    );
  };

  const handleUpdateAllocation = (projectId: string, newBudget: number) => {
    setBudgetAllocations((prev) =>
      prev.map((allocation) => {
        if (allocation.projectId === projectId) {
          let status: "under_budget" | "on_budget" | "over_budget" =
            "on_budget";
          if (allocation.currentCost < newBudget * 0.8) {
            status = "under_budget";
          } else if (allocation.currentCost > newBudget) {
            status = "over_budget";
          }

          return {
            ...allocation,
            allocatedBudget: newBudget,
            projectedCost: newBudget,
            status,
          };
        }
        return allocation;
      })
    );

    if (onBudgetUpdate) {
      onBudgetUpdate(projectId, newBudget);
    }
  };

  const getTotalAllocatedBudget = () => {
    return budgetAllocations.reduce(
      (sum, allocation) => sum + allocation.allocatedBudget,
      0
    );
  };

  const getTotalCurrentCost = () => {
    return budgetAllocations.reduce(
      (sum, allocation) => sum + allocation.currentCost,
      0
    );
  };

  const getBudgetUtilization = () => {
    return totalBudget > 0
      ? (getTotalAllocatedBudget() / totalBudget) * 100
      : 0;
  };

  const getStatusColor = (status: BudgetAllocation["status"]) => {
    switch (status) {
      case "under_budget":
        return "text-green-500 bg-green-900/20";
      case "on_budget":
        return "text-blue-500 bg-blue-900/20";
      case "over_budget":
        return "text-red-500 bg-red-900/20";
      default:
        return "text-gray-500 bg-gray-900/20";
    }
  };

  const getPriorityColor = (priority: BudgetAllocation["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-500 bg-red-900/20";
      case "medium":
        return "text-yellow-500 bg-yellow-900/20";
      case "low":
        return "text-green-500 bg-green-900/20";
      default:
        return "text-gray-500 bg-gray-900/20";
    }
  };

  const availableProjects = projects.filter(
    (p) => !budgetAllocations.some((a) => a.projectId === p.id)
  );

  if (isLoading) {
    return (
      <div className={`project-budget-planner ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-secondary rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`project-budget-planner ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-500 mr-3" />
              Project Budget Planner
            </h2>
            <p className="text-text-secondary">
              Plan and track budgets across multiple projects
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddProject(true)}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Project Budget
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Budget */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary">
              Total Budget
            </label>
            <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
          </div>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-text-primary"
            min="0"
            step="100"
            title="Total budget amount"
          />
        </div>

        {/* Allocated Budget */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">
              Allocated
            </span>
            <ChartBarIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(getTotalAllocatedBudget())}
          </div>
          <div className="text-sm text-text-secondary">
            {getBudgetUtilization().toFixed(1)}% of total
          </div>
        </div>

        {/* Current Spending */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">
              Current Cost
            </span>
            <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(getTotalCurrentCost())}
          </div>
          <div className="text-sm text-text-secondary">Actual spending</div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">
              Remaining
            </span>
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(totalBudget - getTotalAllocatedBudget())}
          </div>
          <div className="text-sm text-text-secondary">
            Available for allocation
          </div>
        </div>
      </div>

      {/* Budget Utilization Bar */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Budget Utilization
          </h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-text-secondary">
              Contingency:
              <input
                type="number"
                value={contingencyPercentage}
                onChange={(e) =>
                  setContingencyPercentage(Number(e.target.value))
                }
                className="ml-2 w-16 px-2 py-1 bg-primary border border-border-color rounded text-text-primary"
                min="0"
                max="50"
              />
              %
            </label>
          </div>
        </div>
        <div className="w-full bg-primary rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${
              getBudgetUtilization() > 100
                ? "bg-red-500"
                : getBudgetUtilization() > 80
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(getBudgetUtilization(), 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-text-secondary">
            {getBudgetUtilization().toFixed(1)}% allocated
          </span>
          <span
            className={`font-medium ${
              getBudgetUtilization() > 100 ? "text-red-500" : "text-green-500"
            }`}>
            {getBudgetUtilization() > 100 ? "Over-allocated" : "Within budget"}
          </span>
        </div>
      </div>

      {/* Project Allocations */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Project Budget Allocations
        </h3>

        {budgetAllocations.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-primary">
              No project budgets allocated yet
            </p>
            <p className="text-text-secondary">
              Add project budgets to start planning
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetAllocations.map((allocation) => (
              <div
                key={allocation.projectId}
                className="p-4 bg-primary rounded-lg border border-border-color">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-text-primary">
                      {allocation.projectName}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        allocation.status
                      )}`}>
                      {allocation.status.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(
                        allocation.priority
                      )}`}>
                      {allocation.priority} priority
                    </span>
                    {/* Risk indicator */}
                    {allocation.riskLevel && allocation.riskLevel !== 'low' && (
                      <span className="flex items-center px-2 py-1 rounded-full text-xs bg-orange-900/20 text-orange-400">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        {allocation.riskLevel} risk
                      </span>
                    )}
                    {/* Timeline indicator */}
                    {allocation.timeline && (
                      <span className="flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/20 text-blue-400">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {allocation.timeline.milestones} milestones
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllocation(allocation.projectId)}
                    className="text-red-400 hover:text-red-300"
                    title="Remove allocation"
                    aria-label={`Remove budget allocation for ${allocation.projectName}`}>
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      Allocated Budget
                    </label>
                    <input
                      type="number"
                      value={allocation.allocatedBudget}
                      onChange={(e) =>
                        handleUpdateAllocation(
                          allocation.projectId,
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-secondary border border-border-color rounded text-text-primary"
                      min="0"
                      step="10"
                      title={`Budget for ${allocation.projectName}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      Current Cost
                    </label>
                    <div className="px-3 py-2 bg-secondary border border-border-color rounded text-text-primary">
                      {formatCurrency(allocation.currentCost)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      Projected Cost
                    </label>
                    <div className="px-3 py-2 bg-secondary border border-border-color rounded text-text-primary">
                      {formatCurrency(allocation.projectedCost)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      Variance
                    </label>
                    <div
                      className={`px-3 py-2 bg-secondary border border-border-color rounded font-medium ${
                        allocation.currentCost > allocation.allocatedBudget
                          ? "text-red-500"
                          : "text-green-500"
                      }`}>
                      {formatCurrency(
                        allocation.allocatedBudget - allocation.currentCost
                      )}
                    </div>
                  </div>
                </div>

                {/* Budget utilization bar for this project */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      allocation.currentCost > allocation.allocatedBudget
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (allocation.currentCost / allocation.allocatedBudget) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAddProject(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-secondary rounded-lg shadow-xl max-w-md w-full border border-border-color">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Add Project Budget
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="text-text-secondary hover:text-text-primary"
                    aria-label="Close dialog"
                    title="Close dialog">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Select Project
                    </label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-3 py-2 bg-primary border border-border-color rounded-md text-text-primary"
                      title="Select project for budget allocation">
                      <option value="">Choose a project...</option>
                      {availableProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Budget Amount
                    </label>
                    <input
                      type="number"
                      value={newBudgetAmount}
                      onChange={(e) =>
                        setNewBudgetAmount(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-primary border border-border-color rounded-md text-text-primary"
                      placeholder="Enter budget amount"
                      min="0"
                      step="10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="px-4 py-2 text-text-primary bg-secondary border border-border-color rounded hover:bg-primary">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProjectBudget}
                    disabled={!selectedProject || newBudgetAmount <= 0}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Add Budget
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBudgetPlanner;
