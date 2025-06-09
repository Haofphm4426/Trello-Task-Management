import { cardModel } from '~/models/cardModel';
import { columnModel } from '~/models/columnModel';
import { CloudinaryProvider } from '~/providers/CloudinaryProvider';


const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    };

    const createdCard = await cardModel.createNew(newCard);
    const getNewCard = await cardModel.findOneById(createdCard.insertedId);

    if (getNewCard) {

      await columnModel.pushCardOrderIds(getNewCard);
    }
    return getNewCard;
  } catch (error) {
    throw error;
  }
};

const update = async (cardId, reqBody, cardCoverFile, userInfo) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    };

    let updatedCard = {};
    if (cardCoverFile) {
      const uploadResult = await CloudinaryProvider.upload(cardCoverFile.buffer, 'card-covers');
      console.log({uploadResult})
      updatedCard = await cardModel.update(cardId, { cover: uploadResult });
    } else if (updateData.commentToAdd) {
      // Tạo dữ liệu comment để thêm vào Database, cần bổ sung thêm những field cần thiết
      const commentData = {
        ...updateData.commentToAdd,
        commentedAt: Date.now(),
        userId: userInfo._id,
        userEmail: userInfo.email
      };
      updatedCard = await cardModel.unshiftNewComment(cardId, commentData);
    } else if (updateData.incomingMemberInfo) {
      // Trường hợp ADD hoặc REMOVE thành viên ra khỏi Card
      updatedCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo);
    } else {
      // Các trường hợp update chung như title, description
      updatedCard = await cardModel.update(cardId, updateData);
    }


    return updatedCard;
  } catch (error) { throw error; }
};

export const cardService = {
  createNew,
  update
};
