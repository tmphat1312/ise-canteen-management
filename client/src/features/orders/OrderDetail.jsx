import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useMoveBack } from "../../hooks/useMoveBack";
import { useCompleteOrder } from "./useCompleteOrder";
import { useCancelOrder } from "./useCancelOrder";
import { useOrder } from "./useOrder";

import ConfirmDelete from "../../ui/ConfirmDelete";
import ErrorLoading from "../../ui/ErrorLoading";
import ButtonGroup from "../../ui/ButtonGroup";
import ButtonText from "../../ui/ButtonText";
import Heading from "../../ui/Heading";
import Spinner from "../../ui/Spinner";
import Button from "../../ui/Button";
import Empty from "../../ui/Empty";
import Modal from "../../ui/Modal";
import Tag from "../../ui/Tag";
import Row from "../../ui/Row";
import OrderDataBox from "./OrderDataBox";

import { ORDER_STATUS_TAGS } from "../../constants/tags";

const HeadingGroup = styled.div`
  display: flex;
  gap: 2.4rem;
  align-items: center;
`;

function OrderDetail() {
  const moveBack = useMoveBack();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrder();
  const { isCancelling, cancelOrder } = useCancelOrder();
  const { isCompleting, completeOrder } = useCompleteOrder();
  const isWorking = isCancelling || isCompleting;

  if (error) return <ErrorLoading error={error} />;

  if (isLoading) return <Spinner />;

  if (!order) return <Empty resourceName="đơn hàng" />;

  const { orderStatus, _id: orderId } = order;
  const tag = ORDER_STATUS_TAGS[orderStatus];

  return (
    <>
      <Row type="horizontal">
        <HeadingGroup>
          <Heading as="h1">Đơn hàng #{orderId}</Heading>
          <Tag type={tag.type}>{tag.label}</Tag>
        </HeadingGroup>
        <ButtonText onClick={moveBack}>
          <span role="presentation">&larr;</span>
          <span>Quay lại</span>
        </ButtonText>
      </Row>

      <OrderDataBox order={order} />

      <ButtonGroup>
        {orderStatus === "xxx" && (
          <Modal>
            <Button>Chuẩn bị</Button>
            <Modal.Open opens="delete">
              <Button variation="danger" disabled={isWorking}>
                Hủy đơn hàng
              </Button>
            </Modal.Open>

            <Modal.Window name="delete">
              <ConfirmDelete
                resourceName="đơn hàng"
                disabled={isWorking}
                onConfirm={() =>
                  cancelOrder(order.id, {
                    onSettled: () => navigate(-1),
                  })
                }
              />
            </Modal.Window>
          </Modal>
        )}

        {orderStatus === "success" && (
          <Button onClick={() => completeOrder(orderId)}>Hoàn tất</Button>
        )}

        <Button variation="secondary" onClick={moveBack}>
          Quay lại
        </Button>
      </ButtonGroup>
    </>
  );
}

export default OrderDetail;
