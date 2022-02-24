import { useGuildConfig } from 'hooks/Guilds/ether-swr/useGuildConfig';
import useVotingPowerPercent from 'hooks/Guilds/guild/useVotingPowerPercent';
import moment, { duration } from 'moment';
import React, { useMemo } from 'react';
import { FiCheck, FiInbox } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useProposal } from '../../../../hooks/Guilds/ether-swr/useProposal';
import { Box } from '../../common/Layout';
import SidebarCard, {
  SidebarCardContent,
  SidebarCardHeader,
} from '../../SidebarCard';
import InfoItem from './InfoItem';
import { Loading } from 'components/Guilds/common/Loading';

const InfoItemLinkerLine = styled(Box)`
  border-left: 1px dashed ${({ theme }) => theme.colors.muted};
  height: 1.5rem;
  position: relative;
  left: 1rem;
`;

const Separator = styled.hr`
  margin: 1.5rem 0;
`;

const UserInfoDetail = styled(Box)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  width: 100%;
  font-weight: 600;
`;

const Label = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.body};
  line-height: ${({ theme }) => theme.lineHeights.body};
  color: ${({ theme, color }) => (color ? color : theme.colors.text)};
`;

const ProposalInfoCard: React.FC = () => {
  const { guild_id: guildId, proposal_id: proposalId } = useParams<{
    chain_name: string;
    guild_id?: string;
    proposal_id?: string;
  }>();
  const { data: proposal, error } = useProposal(guildId, proposalId);

  const { data: guildConfig } = useGuildConfig(guildId);
  const quorum = useVotingPowerPercent(
    guildConfig?.votingPowerForProposalExecution,
    guildConfig?.totalLocked
  );

  const endDetail = useMemo(() => {
    if (!proposal || !proposal.endTime) return null;

    const currentTime = moment();
    if (proposal.endTime.isBefore(currentTime)) {
      return `Ended ${proposal.endTime.fromNow()}`;
    } else {
      return `Ends ${proposal.endTime.toNow()}`;
    }
  }, [proposal]);

  if (error) return <div>Error</div>;

  return (
    <SidebarCard header={<SidebarCardHeader>Information</SidebarCardHeader>}>
      <SidebarCardContent>
        {!proposal ? (
          <Loading loading text skeletonProps={{ height: '100px' }} />
        ) : (
          <>
            <InfoItem
              icon={<FiCheck />}
              title="Proposal created"
              description={proposal.startTime.format('MMM Do, YYYY - h:mm a')}
              link="/"
            />
            <InfoItemLinkerLine />
            <InfoItem
              icon={<FiInbox />}
              title={endDetail}
              description={proposal.endTime.format('MMM Do, YYYY - h:mm a')}
            />
          </>
        )}

        <Separator />

        <UserInfoDetail>
          <Label>Consensus System</Label>
          <Label color={({ theme }) => theme.colors.proposalText.lightGrey}>Guild</Label>
        </UserInfoDetail>
        <UserInfoDetail>
          <Label>Proposal Duration</Label>
          <Label color={({ theme }) => theme.colors.proposalText.lightGrey}>
            {guildConfig?.proposalTime ? (
              duration(
                guildConfig?.proposalTime?.toNumber(),
                'seconds'
              ).humanize()
            ) : (
              <Loading loading text skeletonProps={{ width: '50px' }} />
            )}
          </Label>
        </UserInfoDetail>
        <UserInfoDetail>
          <Label>Quorum</Label>
          <Label color={({ theme }) => theme.colors.proposalText.lightGrey}>
            {quorum != null ? (
              `${quorum}%`
            ) : (
              <Loading loading text skeletonProps={{ width: '50px' }} />
            )}
          </Label>
        </UserInfoDetail>
      </SidebarCardContent>
    </SidebarCard>
  );
};

export default ProposalInfoCard;
