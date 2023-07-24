import { Project } from "@fgpt/precedent-iso";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import ModeEditIcon from "@mui/icons-material/ModeEditOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { format } from "fecha";

import {
  Badge,
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Link,
  ListItemDecorator,
  Menu,
  MenuItem,
  Typography,
} from "@mui/joy";
import React from "react";

import styles from "./display-projects.module.css";
import { useHover } from "./use-hover";

export const DisplayProjects: React.FC<{
  openCreateProjects: () => void;
  projectsLoading: boolean;
  projects: Project[];
  setEditingProject: (projectId: string, projectName: string) => void;
  setDeletingProject: (projectId: string, projectName: string) => void;
}> = ({
  openCreateProjects,
  projectsLoading,
  projects,
  setEditingProject,
  setDeletingProject,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      paddingBottom={2}
      paddingX={2}
      maxHeight="100%"
      height="100%"
      overflow="auto"
    >
      {projectsLoading && (
        <Box
          display="flex"
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
        >
          <CircularProgress sx={{ width: "100%" }} />
        </Box>
      )}

      {!projectsLoading && (
        <Box
          display="grid"
          gridTemplateColumns="repeat( auto-fit, 250px )"
          gridAutoRows="auto"
          gap="1rem"
          className={styles["projects-grid"]}
          justifyContent="start"
          maxHeight="100%"
          overflow="auto"
          paddingTop={3}
        >
          <Card
            onClick={openCreateProjects}
            variant="outlined"
            sx={{
              width: "250px",
              height: "250px",
              padding: 0,

              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "rgba(0, 0, 0, 0.06) 0px 2px 4px",
              transition: "all .3s ease-in-out",
              "&:hover": {
                boxShadow: "rgba(0, 0, 0, 0.22) 0px 9px 21px",
                transform: "translate3d(0px, -1px, 0px)",
              },
            }}
          >
            <AddCircleOutlineOutlinedIcon />
            <Typography
              level="h2"
              fontSize="md"
              textAlign={"center"}
              sx={{ mb: 0.5 }}
            >
              Add a deal
            </Typography>
          </Card>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              setEditingProject={setEditingProject}
              setDeletingProject={setDeletingProject}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  setEditingProject: (projectId: string, projectName: string) => void;
  setDeletingProject: (projectId: string, projectName: string) => void;
}> = ({ project, setEditingProject, setDeletingProject }) => {
  const [ref, hovering] = useHover();

  const cardRef = React.useRef(null);

  const [isOpen, setIsOpen] = React.useState(false);

  const ActionMenu = () => (
    <Menu
      anchorEl={cardRef.current}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      placement="right"
    >
      <MenuItem
        onClick={() => {
          setEditingProject(project.id, project.name);
          setIsOpen(false);
        }}
      >
        <ListItemDecorator>
          <ModeEditIcon color="info" />
        </ListItemDecorator>
        Edit name
      </MenuItem>
      <MenuItem
        onClick={() => {
          setDeletingProject(project.id, project.name);
          setIsOpen(false);
        }}
      >
        <ListItemDecorator>
          <DeleteIcon color="error" />
        </ListItemDecorator>
        Delete deal
      </MenuItem>
    </Menu>
  );

  return (
    <Badge
      key={project.id}
      ref={ref}
      invisible={!hovering}
      onClick={() => setIsOpen(true)}
      badgeContent={
        <IconButton
          size="sm"
          variant="plain"
          sx={{
            "&:hover": {
              bgcolor: "transparent",
            },
          }}
        >
          <MoreVertOutlinedIcon />
        </IconButton>
      }
      sx={{
        "& .MuiBadge-badge": {
          backgroundColor: "neutral.50",
        },
      }}
    >
      <ActionMenu />
      <Card
        variant="outlined"
        sx={{
          width: "250px",
          height: "250px",
          padding: 0,
          transition: "all .3s ease-in-out",
          boxShadow: "rgba(0, 0, 0, 0.06) 0px 2px 4px",
          ...(hovering
            ? {
                boxShadow: "rgba(0, 0, 0, 0.22) 0px 9px 21px",
                transform: "translate3d(0px, -1px, 0px)",
              }
            : {}),
          "&:hover": {
            textDecoration: "none",
          },
        }}
        href={`/projects/${project.id}`}
        component={Link}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Box
          display="flex"
          width="100%"
          bgcolor="primary.900"
          flexDirection="column"
          color="neutral.50"
          padding={2}
          height="50%"
          justifyContent="center"
          borderRadius={"8px 8px 0 0"}
          sx={(theme) => ({
            background: `linear-gradient(-45deg, ${theme.vars.palette.primary[900]}, ${theme.vars.palette.primary[500]})`,
            fontWeight: "lg", // short-hand syntax, same as `theme.fontWeight.lg`
          })}
        >
          <Typography
            level="h1"
            fontSize="md"
            ref={cardRef}
            textAlign={"center"}
            sx={{ mb: 0.5, color: "neutral.50" }}
          >
            {project.name}
          </Typography>
        </Box>

        <CardContent
          orientation="horizontal"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingX: 2,
            width: "100%",
          }}
        >
          <Box display="flex" flexDirection="column" width="100%">
            <Typography
              level="body2"
              sx={{
                color: "neutral.500",
              }}
            >
              Created{" "}
              {format(new Date(project.createdAt), "[on] MMMM Do, YYYY")}
            </Typography>
            <Typography
              level="body2"
              sx={{
                textDecoration: "none",

                "&:hover": {
                  textDecoration: "none",
                },
              }}
            >
              {copyForAssets(project.fileCount)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Badge>
  );
};

function copyForAssets(fileCount: number): string {
  if (fileCount === 1) {
    return "1 asset";
  }
  return `${fileCount} assets`;
}
