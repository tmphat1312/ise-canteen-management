import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdateUser } from "../authentication/useUpdateUser";

import FormRowVertical from "../../ui/FormRowVertical";
import FileInput from "../../ui/FileInput";
import FormRow from "../../ui/FormRow";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Form from "../../ui/Form";

import { FORM_RULES } from "../../constants/form";
import { formatVietnameseCurrency } from "../../utils/helpers";

function UpdateCustomerDataForm({ user }) {
  const [image, setImage] = useState(null);
  const { isUpdating, updateUser } = useUpdateUser();
  const defaultValues = {
    name: user.name,
    phone: user.phone,
  };
  const { handleSubmit, register, reset, formState } = useForm({
    defaultValues,
  });
  const { errors, isSubmitting } = formState;
  const isWorking = isUpdating || isSubmitting;

  function onSubmit(data) {
    if (image) {
      data.image = image;
    }

    updateUser(data);
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormRowVertical label="Email">
        <Input value={user.email} disabled type="email" />
      </FormRowVertical>
      <FormRowVertical label="Số dư tài khoản">
        <Input
          value={formatVietnameseCurrency(user.balance)}
          disabled
          type="text"
        />
      </FormRowVertical>
      <FormRowVertical label="Tên người dùng" error={errors.name?.message}>
        <Input
          type="text"
          id="name"
          disabled={isWorking}
          {...register("name", FORM_RULES.FULL_NAME)}
        />
      </FormRowVertical>
      <FormRowVertical
        label={`Số điện thoại ${!user.phone ? "(Cập nhật lần đầu)" : ""}`}
        error={errors.phone?.message}
      >
        <Input
          type="tel"
          id="tel"
          autoComplete="phone"
          disabled={isWorking}
          {...register("phone", FORM_RULES.PHONE)}
          maxLength={10}
        />
      </FormRowVertical>
      <FormRowVertical label="Ảnh đại diện">
        <FileInput
          disabled={isWorking}
          id="image"
          accept="image/*"
          onChange={(e) => {
            setImage(e.target.files[0]);
          }}
        />
      </FormRowVertical>

      <FormRow hasButton>
        <Button
          type="button"
          variation="secondary"
          disabled={!isSubmitting}
          onClick={() => reset(defaultValues)}
        >
          Hủy
        </Button>
        <Button disabled={isWorking}>Lưu thay đổi</Button>
      </FormRow>
    </Form>
  );
}

export default UpdateCustomerDataForm;
