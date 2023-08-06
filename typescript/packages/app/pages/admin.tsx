import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Prompt, User } from "@fgpt/precedent-iso";
import {
  Box,
  Button,
  Option,
  Select,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Typography,
} from "@mui/joy";
import { TextField } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DisplayUserInvitiations } from "../src/components/admin/invite-user";
import { Navbar } from "../src/components/navbar";
import { useFetchMe } from "../src/hooks/use-fetch-me";
import { useFetchOrganizations } from "../src/hooks/use-fetch-organizations";
import { useFetchPrompts } from "../src/hooks/use-fetch-prompts";
import { useFetchUsers } from "../src/hooks/use-fetch-users";
import { useUpsertPrompt } from "../src/hooks/use-upsert-prompt";
import { ImpersonateService } from "../src/services/impersonate-service";

const Admin: React.FC = () => {
  const { data: user } = useFetchMe();
  const { data: organizations } = useFetchOrganizations();
  const { data: prompts } = useFetchPrompts();

  const router = useRouter();

  React.useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role !== "superadmin") {
      router.push("/");
    }
  }, [user, router]);

  return (
    <Box
      display="flex"
      height="100%"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      flexDirection="column"
    >
      <Navbar loading={false} />
      <Box
        display="flex"
        height="100%"
        width="100%"
        maxHeight="100%"
        maxWidth="100%"
        overflow="auto"
        flexDirection="column"
        padding={2}
        gap={2}
      >
        <Typography level="h3">Admin</Typography>

        <Tabs defaultValue={"users"}>
          <TabList>
            <Tab value="users">Users</Tab>
            <Tab value="prompts">Prompts</Tab>
          </TabList>
          <TabPanel value="users">
            {user && <DisplayUsers userId={user.id} />}
            <DisplayUserInvitiations organizations={organizations} />
          </TabPanel>

          <TabPanel value="prompts">
            {prompts.length > 0 && <DisplayPrompts prompts={prompts} />}
          </TabPanel>
        </Tabs>
      </Box>
    </Box>
  );
};

const DisplayUsers: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: users } = useFetchUsers();
  const columns: GridColDef<User>[] = [
    {
      field: "email",
      headerName: "Email",
      minWidth: 300,
    },
    {
      field: "role",
      headerName: "Role",
      minWidth: 300,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 300,
    },
    {
      minWidth: 300,
      field: "organizationId",
      headerName: "Organization id",
    },
    {
      minWidth: 300,
      field: "impersonate",
      headerName: "Impersonate",
      renderCell: (params) => {
        if (userId === params.row.id) {
          return null;
        }
        return (
          <Button
            onClick={() => {
              ImpersonateService.set(params.row.id);
              window.location.href = "/";
            }}
          >
            Impersonate {params.row.email}
          </Button>
        );
      },
    },
  ];
  return (
    <DataGrid
      rows={users}
      columns={columns}
      disableRowSelectionOnClick
      disableColumnFilter
      disableColumnMenu
      hideFooter={true}
      hideFooterPagination
      getRowHeight={() => "auto"}
    />
  );
};

const DisplayPrompts: React.FC<{ prompts: Prompt[] }> = ({ prompts }) => {
  const { trigger, isMutating } = useUpsertPrompt();
  const [selectedSlug, setSelectedSlug] = React.useState<string>(() => {
    const [prompt] = prompts;
    if (!prompt) {
      throw new Error("No prompt found");
    }
    return prompt.slug;
  });

  const prompt = prompts.find((p) => p.slug === selectedSlug);

  const [value, setValue] = React.useState(() => {
    const prompt = prompts.find((p) => p.slug === selectedSlug);
    if (!prompt) {
      throw new Error("No prompt found");
    }
    return prompt.definition.template;
  });

  React.useEffect(() => {
    if (selectedSlug) {
      return;
    }
    const [prompt] = prompts;
    if (prompt) {
      setSelectedSlug(prompt.slug);
      setValue(prompt.definition.template);
    }
  }, [selectedSlug, prompts]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      gap={2}
    >
      <Select
        value={selectedSlug ?? null}
        onChange={(e, value) => {
          if (!value) {
            throw new Error("invalid state");
          }
          const prompt = prompts.find((p) => p.slug === value);
          if (prompt) {
            setSelectedSlug(value);
            setValue(prompt.definition.template);
            return;
          }
        }}
      >
        <>
          {prompts.map((prompt) => (
            <Option key={prompt.slug} value={prompt.slug}>
              {prompt.slug}
            </Option>
          ))}
        </>
      </Select>
      {prompt && (
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={20}
            multiline
          />
          <Button
            loading={isMutating}
            onClick={async () => {
              await trigger({
                slug: prompt.slug,
                template: value.trim(),
              });
            }}
            disabled={value === prompt.definition.template}
          >
            Submit
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default withPageAuthRequired(Admin);
