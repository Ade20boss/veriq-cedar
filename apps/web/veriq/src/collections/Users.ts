import type { Access, CollectionConfig, PayloadRequest } from "payload"

const isPayloadAdmin = (req: PayloadRequest) =>
  req.user?.collection === "admins"

const isAppRegistration = (req: PayloadRequest) =>
  req.context.appRegistration === true

const isSelfOrPayloadAdmin: Access = ({ req }) => {
  if (isPayloadAdmin(req)) return true
  if (req.user?.collection !== "users") return false

  return {
    id: {
      equals: req.user.id,
    },
  }
}

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    create: ({ req }) =>
      isPayloadAdmin(req) || (!req.user && isAppRegistration(req)),
    delete: ({ req }) => isPayloadAdmin(req),
    read: isSelfOrPayloadAdmin,
    update: isSelfOrPayloadAdmin,
  },
  admin: {
    defaultColumns: ["displayName", "email", "status", "updatedAt"],
    group: "Application",
    useAsTitle: "displayName",
  },
  auth: true,
  fields: [
    {
      name: "displayName",
      type: "text",
      required: true,
    },
    {
      name: "status",
      type: "select",
      access: {
        create: ({ req }) => isPayloadAdmin(req) || isAppRegistration(req),
        update: ({ req }) => isPayloadAdmin(req),
      },
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      required: true,
    },
    {
      name: "appRole",
      type: "select",
      access: {
        create: ({ req }) => isPayloadAdmin(req) || isAppRegistration(req),
        update: ({ req }) => isPayloadAdmin(req),
      },
      defaultValue: "member",
      options: [
        { label: "Member", value: "member" },
        { label: "Investigator", value: "investigator" },
        { label: "Workspace administrator", value: "workspace-admin" },
      ],
      required: true,
    },
    {
      name: "memberships",
      type: "array",
      access: {
        create: ({ req }) => isPayloadAdmin(req) || isAppRegistration(req),
        update: ({ req }) => isPayloadAdmin(req),
      },
      admin: {
        description:
          "Institutions this application user is authorized to access.",
      },
      defaultValue: [],
      fields: [
        {
          name: "institutionId",
          type: "text",
          required: true,
        },
        {
          name: "institutionName",
          type: "text",
          required: true,
        },
        {
          name: "role",
          type: "select",
          defaultValue: "analyst",
          options: [
            { label: "Analyst", value: "analyst" },
            { label: "Investigator", value: "investigator" },
            { label: "Reviewer", value: "reviewer" },
            { label: "Institution administrator", value: "institution-admin" },
          ],
          required: true,
        },
        {
          name: "setupState",
          type: "select",
          defaultValue: "institution",
          options: [
            { label: "Institution setup", value: "institution" },
            { label: "Profile setup", value: "profile" },
            { label: "Access review", value: "access-review" },
            { label: "Complete", value: "complete" },
          ],
          required: true,
        },
      ],
    },
  ],
}
