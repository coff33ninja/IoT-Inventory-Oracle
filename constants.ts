import { ItemStatus } from './types';

export const STATUS_CONFIG: { [key in ItemStatus]: { color: string; label: string } } = {
  [ItemStatus.HAVE]: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'In Stock' },
  [ItemStatus.WANT]: { color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', label: 'Wishlist' },
  [ItemStatus.NEED]: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Required' },
  [ItemStatus.SALVAGED]: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Salvaged Parts' },
  [ItemStatus.RETURNED]: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Returned' },
  [ItemStatus.DISCARDED]: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Discarded' },
  [ItemStatus.GIVEN_AWAY]: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Given Away' },
};
