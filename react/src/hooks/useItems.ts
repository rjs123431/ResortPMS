import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@services/data.service';
import { ListItem } from '../types/api.types';

export const useItems = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ['items', page, pageSize],
    queryFn: ({ signal }) => dataService.getItems(page, pageSize, signal),
  });
};

export const useItem = (id: string) => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: ({ signal }) => dataService.getItemById(id, signal),
    enabled: !!id,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Omit<ListItem, 'id' | 'createdAt'>) =>
      dataService.createItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ListItem> }) =>
      dataService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
