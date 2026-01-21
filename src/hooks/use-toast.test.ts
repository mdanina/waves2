import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from './use-toast';

describe('toast reducer', () => {
  const createToast = (id: string, title?: string) => ({
    id,
    title,
    open: true,
    onOpenChange: vi.fn(),
  });

  describe('ADD_TOAST', () => {
    it('should add toast to empty state', () => {
      const state = { toasts: [] };
      const newToast = createToast('1', 'Test toast');

      const result = reducer(state, { type: 'ADD_TOAST', toast: newToast });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]).toEqual(newToast);
    });

    it('should add toast to beginning of array', () => {
      const existingToast = createToast('1', 'First');
      const state = { toasts: [existingToast] };
      const newToast = createToast('2', 'Second');

      const result = reducer(state, { type: 'ADD_TOAST', toast: newToast });

      expect(result.toasts[0].id).toBe('2');
    });

    it('should limit toasts to TOAST_LIMIT (1)', () => {
      const toast1 = createToast('1', 'First');
      const toast2 = createToast('2', 'Second');
      const state = { toasts: [toast1] };

      const result = reducer(state, { type: 'ADD_TOAST', toast: toast2 });

      // TOAST_LIMIT is 1, so only the newest toast should remain
      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('should update existing toast', () => {
      const existingToast = createToast('1', 'Original');
      const state = { toasts: [existingToast] };

      const result = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(result.toasts[0].title).toBe('Updated');
    });

    it('should preserve other properties when updating', () => {
      const existingToast = { ...createToast('1', 'Original'), description: 'Desc' };
      const state = { toasts: [existingToast] };

      const result = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(result.toasts[0].description).toBe('Desc');
      expect(result.toasts[0].title).toBe('Updated');
    });

    it('should not update non-matching toast', () => {
      const toast1 = createToast('1', 'First');
      const toast2 = createToast('2', 'Second');
      const state = { toasts: [toast1, toast2] };

      const result = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated First' },
      });

      expect(result.toasts[1].title).toBe('Second');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('should set toast open to false', () => {
      const existingToast = createToast('1', 'Test');
      const state = { toasts: [existingToast] };

      const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });

      expect(result.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts if no toastId provided', () => {
      const toast1 = createToast('1', 'First');
      const toast2 = createToast('2', 'Second');
      const state = { toasts: [toast1, toast2] };

      const result = reducer(state, { type: 'DISMISS_TOAST' });

      expect(result.toasts[0].open).toBe(false);
      expect(result.toasts[1].open).toBe(false);
    });

    it('should only dismiss specified toast', () => {
      const toast1 = createToast('1', 'First');
      const toast2 = createToast('2', 'Second');
      const state = { toasts: [toast1, toast2] };

      const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });

      expect(result.toasts[0].open).toBe(false);
      expect(result.toasts[1].open).toBe(true);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('should remove specified toast', () => {
      const toast1 = createToast('1', 'First');
      const toast2 = createToast('2', 'Second');
      const state = { toasts: [toast1, toast2] };

      const result = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });

    it('should remove all toasts if no toastId provided', () => {
      const toast1 = createToast('1', 'First');
      const toast2 = createToast('2', 'Second');
      const state = { toasts: [toast1, toast2] };

      const result = reducer(state, { type: 'REMOVE_TOAST' });

      expect(result.toasts).toHaveLength(0);
    });

    it('should handle removing non-existent toast', () => {
      const existingToast = createToast('1', 'Test');
      const state = { toasts: [existingToast] };

      const result = reducer(state, { type: 'REMOVE_TOAST', toastId: 'non-existent' });

      expect(result.toasts).toHaveLength(1);
    });
  });
});

describe('useToast hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return toast function', () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.toast).toBe('function');
  });

  it('should return dismiss function', () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('should return toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('should add toast when toast function is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
  });

  it('should dismiss toast when dismiss is called', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const { id } = result.current.toast({ title: 'Test' });
      toastId = id;
    });

    act(() => {
      result.current.dismiss(toastId!);
    });

    expect(result.current.toasts[0]?.open).toBe(false);
  });
});

describe('toast function', () => {
  it('should return id, dismiss, and update functions', () => {
    const result = toast({ title: 'Test' });

    expect(typeof result.id).toBe('string');
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  it('should generate unique ids', () => {
    const result1 = toast({ title: 'First' });
    const result2 = toast({ title: 'Second' });

    expect(result1.id).not.toBe(result2.id);
  });

  it('should set open to true by default', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Test' });
    });

    expect(result.current.toasts[0]?.open).toBe(true);
  });

  it('should call onOpenChange with false when dismissed', () => {
    const { result } = renderHook(() => useToast());

    let toastResult: ReturnType<typeof toast>;
    act(() => {
      toastResult = toast({ title: 'Test' });
    });

    // Get the toast's onOpenChange
    const toastInstance = result.current.toasts.find(t => t.id === toastResult!.id);

    act(() => {
      toastInstance?.onOpenChange?.(false);
    });

    // Toast should be dismissed (open: false)
    const updatedToast = result.current.toasts.find(t => t.id === toastResult!.id);
    expect(updatedToast?.open).toBe(false);
  });
});

describe('toast with different content', () => {
  it('should handle toast with title only', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Title Only' });
    });

    expect(result.current.toasts[0].title).toBe('Title Only');
    expect(result.current.toasts[0].description).toBeUndefined();
  });

  it('should handle toast with title and description', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Title', description: 'Description text' });
    });

    expect(result.current.toasts[0].title).toBe('Title');
    expect(result.current.toasts[0].description).toBe('Description text');
  });

  it('should handle destructive variant', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Error', variant: 'destructive' });
    });

    expect(result.current.toasts[0].variant).toBe('destructive');
  });
});

describe('toast update functionality', () => {
  it('should update toast content', () => {
    const { result } = renderHook(() => useToast());

    let toastResult: ReturnType<typeof toast>;
    act(() => {
      toastResult = toast({ title: 'Original' });
    });

    act(() => {
      toastResult!.update({ id: toastResult!.id, title: 'Updated' });
    });

    const updatedToast = result.current.toasts.find(t => t.id === toastResult!.id);
    expect(updatedToast?.title).toBe('Updated');
  });
});
