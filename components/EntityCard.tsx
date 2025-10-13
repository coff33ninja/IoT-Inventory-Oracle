import React from "react";
import { HomeAssistantEntity } from "../types";
import { useHomeAssistant } from "../contexts/HomeAssistantContext";
import { useInventory } from "../contexts/InventoryContext";
import { LinkIcon } from "./icons/LinkIcon";
import { TrashIcon } from "./icons/TrashIcon";

interface EntityCardProps {
  entity: HomeAssistantEntity;
  onLink: (entity: HomeAssistantEntity) => void;
}

const EntityCard: React.FC<EntityCardProps> = ({ entity, onLink }) => {
  const { links, removeLink } = useHomeAssistant();
  const { inventory } = useInventory();

  const link = links.find((l) => l.entityId === entity.entity_id);
  const linkedItem = link
    ? inventory.find((i) => i.id === link.inventoryId)
    : null;

  const name = entity.attributes.friendly_name || entity.entity_id;
  const state = entity.state;

  return (
    <div className="bg-secondary border border-border-color rounded-lg flex flex-col justify-between">
      <div className="p-4">
        <h3 className="font-semibold text-text-primary truncate" title={name}>
          {name}
        </h3>
        <p
          className="text-sm text-text-secondary truncate"
          title={entity.entity_id}>
          {entity.entity_id}
        </p>
        <div className="mt-2 text-center">
          <span className="text-lg font-bold text-accent px-3 py-1 bg-primary rounded-full inline-block">
            {state}
          </span>
        </div>
      </div>
      <div className="p-3 bg-primary/50 rounded-b-lg border-t border-border-color">
        {linkedItem ? (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-text-secondary">Linked to:</p>
              <p className="text-sm font-semibold text-text-primary truncate">
                {linkedItem.name}
              </p>
            </div>
            <button
              onClick={() => removeLink(entity.entity_id)}
              className="p-2 text-danger hover:bg-danger/20 rounded-full transition-colors"
              aria-label="Remove link to inventory item"
              type="button">
              <TrashIcon />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onLink(entity)}
            className="w-full flex items-center justify-center gap-2 text-sm bg-secondary hover:bg-border-color border border-border-color p-2 rounded-md transition-colors"
            type="button">
            <LinkIcon /> Link to Inventory
          </button>
        )}
      </div>
    </div>
  );
};

export default EntityCard;
