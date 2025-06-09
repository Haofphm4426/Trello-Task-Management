
import Box from '@mui/material/Box';
import ListColumns from './ListColumns/ListColumns';

import {
  DndContext,
  // MouseSensor,
  // TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  // closestCenter,
  closestCorners,
  pointerWithin,
  // rectIntersection,
  getFirstCollision
} from '@dnd-kit/core';
import { TouchSensor, MouseSensor } from '~/customLibs/DndKitSensors';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cloneDeep, isEmpty } from 'lodash';
import { generatePlacehoderCard } from '~/utils/formatters';

import Column from './ListColumns/Column/Column';
import Card from './ListColumns/Column/ListCards/Card/Card';

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
};

function BoardContent({
  board, moveColumns,
  moveCardInTheSameColumn,
  moveCardToDifferentColumn
}) {

  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } });
  // Yêu cầu chuốt di chuyển 10px mới kích hoạt event
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } });

  // const sensors = useSensors(pointerSensor);
  //Ưu tiên sử dụng kết hợp 2 loại sensor để có trải nghiệm trên mobile tốt nhất
  const sensors = useSensors(mouseSensor, touchSensor);

  const [orderedColumns, setOrderedColumns] = useState([]);

  const [activeDragItemId, setActiveDragItemId] = useState(null);
  const [activeDragItemType, setActiveDragItemType] = useState(null);
  const [activeDragItemData, setActiveDragItemData] = useState(null);
  const [oldColumn, setOldColumn] = useState(null);

  //Điểm va chạm cuối cùng trước đó (xử lý thuật toán phát hiện va chạm)
  const lastOverId = useRef(null);

  useEffect(() => {
    setOrderedColumns(board.columns);
  }, [board]);

  const findColumnByCardId = (cardId) => {
    return orderedColumns.find(col => col.cards.map(card => card._id)?.includes(cardId ));
  };

  const moveCardBetweenDifferentColumns = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData,
    triggerFrom
  ) => {
    setOrderedColumns(prevColumns => {
      const overCardIndex = overColumn?.cards?.findIndex(card => card._id === overCardId);

      let newCardIndex;
      const isBelowOverItem = active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + (over.rect.height / 2);
      const modifier = isBelowOverItem ? 1 : 0;
      newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?. length + 1;

      const nextColumns = cloneDeep(prevColumns);
      const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id);
      const nextOverColumn = nextColumns.find(column => column._id === overColumn._id);

      if (nextActiveColumn) {
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId);

        if (isEmpty(nextActiveColumn.cards)) {
          nextActiveColumn.cards = [generatePlacehoderCard(nextActiveColumn)];
        }

        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id);
      }

      if (nextOverColumn ) {
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId);

        //Phải cập nhật lại chuẩn columnId của card sau khi kéo card qua column khác
        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id
        };

        nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, rebuild_activeDraggingCardData);

        //Xóa placeholder card nếu đang tồn tại
        nextOverColumn.cards = nextOverColumn.cards.filter(card => !card.FE_PlaceholderCard);

        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id);
      }

      if (triggerFrom === 'handleDragEnd') {
        //
        moveCardToDifferentColumn(activeDraggingCardId, oldColumn._id, nextOverColumn._id, nextColumns);
      }

      return nextColumns;
    });
  };

  const handleDragStart = (e) => {
    setActiveDragItemId(e?.active?.id);
    setActiveDragItemType(e?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN);
    setActiveDragItemData(e?.active?.data?.current);

    if (e?.active?.data?.current?.columnId) {
      setOldColumn(findColumnByCardId(e?.active?.id));
    }
  };

  const handleDragOver = (e) => {
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return;

    const { active, over } = e;

    if (!active || !over) return;

    const { id: activeDraggingCardId, data: { current:  activeDraggingCardData } } = active;
    const { id: overCardId } = over;

    //Tìm 2 column theo cardId
    const activeColumn = findColumnByCardId(activeDraggingCardId);
    const overColumn = findColumnByCardId(overCardId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn._id !== overColumn._id) {
      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData,
        'handleDragOver'
      );
    }
  };

  const handleDragEnd = (e) => {
    const { active, over } = e;

    //Nếu không tồn tại over (kéo linh tinh qua chỗ khác) thì return để tránh lỗi
    if (!active || !over) return;

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active.id !== over.id) {
        //Lấy vị trí cũ
        const oldColumIndex = orderedColumns.findIndex(c => c._id === active.id);
        //Lấy vị trí cũ
        const newColumnIndex = orderedColumns.findIndex(c => c._id === over.id);

        const dndOrderedColumns = arrayMove(orderedColumns, oldColumIndex, newColumnIndex);

        setOrderedColumns(dndOrderedColumns);
        moveColumns(dndOrderedColumns);

      }
      return;
    }

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {

      const { id: activeDraggingCardId, data: { current:  activeDraggingCardData } } = active;
      const { id: overCardId } = over;

      //Tìm 2 column theo cardId
      const activeColumn = findColumnByCardId(activeDraggingCardId);
      const overColumn = findColumnByCardId(overCardId);

      if (!activeColumn || !overColumn) return;

      if (oldColumn._id !== overColumn._id) {
        //
        moveCardBetweenDifferentColumns(
          overColumn,
          overCardId,
          active,
          over,
          activeColumn,
          activeDraggingCardId,
          activeDraggingCardData,
          'handleDragEnd'
        );
      } else {
        const oldCardIndex = oldColumn?.cards?.findIndex(c => c._id === activeDragItemId);
        //Lấy vị trí cũ
        const newCardIndex = overColumn?.cards?.findIndex(c => c._id === overCardId);
        const dndOrderedCards = arrayMove(oldColumn?.cards, oldCardIndex, newCardIndex);
        const dndOrderedCardsIds = dndOrderedCards.map(c => c._id);

        setOrderedColumns(prevColumns => {
          const nextColumns = cloneDeep(prevColumns);
          const targetColumn = nextColumns.find(c => c._id === overColumn._id);

          targetColumn.cards = dndOrderedCards;
          targetColumn.cardOrderIds = dndOrderedCardsIds;

          return nextColumns;
        });
        moveCardInTheSameColumn(dndOrderedCards, dndOrderedCardsIds, oldColumn._id);
      }
    }


    setActiveDragItemId(null);
    setActiveDragItemType(null);
    setActiveDragItemData(null);
    setOldColumn(null);
  };

  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } }
    })
  };

  const collisionDetectionStrategy = useCallback((args) => {
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return closestCorners({ ...args });

    }

    //Tìm điểm giao nhau, va chạm = intersections với con trỏ
    const pointerIntersections = pointerWithin(args);


    if (!pointerIntersections?.length) return;

    //Thuật toán phát hiện va chạm sẽ trả về một mảng các va chạm ở đây
    // const intersections = !!pointerIntersections?.length
    //   ? pointerIntersections
    //   : rectIntersection(args);

    // Tìm overId đầu tiên trong đám pointerIntersections ở trên
    let overId = getFirstCollision(pointerIntersections, 'id');
    if (overId) {
      // Nếu cái over nó là column thì sẽ tìm tới cái cardId gần nhất bên t rong khu vực va chạm đó dựa vào thuật toán phát hiện va chạm closestCenter hoặc closestCorners đều được. Tuy nhiên ở đây dùng closestCorners thấy mượt hơn
      const checkColumn = orderedColumns.find(col => col._id === overId);
      if (checkColumn) {
        overId = closestCorners({
          ...args,
          droppableContainers: args.droppableContainers.filter(container => (
            (container.id !== overId) && (checkColumn?.cardOrderIds?.includes(container.id))
          ))
        })[0]?.id;
      }

      lastOverId.current = overId;
      return [{ id: overId }];
    }

    return lastOverId.current ? [{ id: lastOverId.current }] : [];

  }, [activeDragItemType, orderedColumns]);

  return (
    <DndContext
      sensors={sensors}
      // collisionDetection={closestCorners }
      collisionDetection={collisionDetectionStrategy }
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      <Box sx={{
        width: '100%',
        height: (theme) => theme.trello.boardContentHeight,
        display: 'flex',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        p: '10px 0'
      }}>
        <ListColumns columns={orderedColumns} />
        <DragOverlay dropAnimation={customDropAnimation }>
          {(!activeDragItemType) && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData}/>}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData}/>}
        </DragOverlay>
      </Box>
    </DndContext>
  );
}

export default BoardContent;